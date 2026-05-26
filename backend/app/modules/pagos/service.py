"""
PagoService — Payment processing and webhook handling.

Business rules:
- RN-AU09: Card data NEVER touches our server (PCI DSS SAQ-A). We receive a token.
- RN-PA01: Tokenization happens in browser via MercadoPago.js.
- RN-PA02: idempotency_key (UUID) per payment attempt prevents double-charge.
- RN-PA03: Webhook responds 200 immediately; processing is fire-and-forget.
- RN-PA04: Always verify payment status via MP API (don't trust webhook body alone).
- RN-PA05: approved → advance Pedido to CONFIRMADO + deduct stock (via PedidoService).
- RN-PA06: rejected → Pedido remains PENDIENTE.
- RN-PA07: pending/in_process → update Pago, Pedido stays PENDIENTE.
- RN-PA08: Multiple payment attempts per order are allowed (1:N Pedido→Pago).
"""

import uuid
import logging
import json
from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.models.pedido import Pago, Pedido, FormaPago, EstadoPedido
from app.modules.pagos.mp_client import MercadoPagoClient
from app.modules.pagos.schemas import PagoCreatePayload
from app.modules.pedidos.service import PedidoService

logger = logging.getLogger(__name__)

# MP status → our internal estado
MP_STATUS_MAP = {
    "approved":   "aprobado",
    "rejected":   "rechazado",
    "pending":    "pendiente",
    "in_process": "en_proceso",
    "cancelled":  "cancelado",
}


class PagoService:
    def __init__(self, session: AsyncSession, mp_client: MercadoPagoClient):
        self.session = session
        self.mp_client = mp_client

    # ── Private helpers ───────────────────────────────────────────────────────

    async def _get_forma_pago_mp_id(self) -> int:
        """Get the ID of the 'mercado_pago' FormaPago record."""
        result = await self.session.execute(
            select(FormaPago).where(FormaPago.nombre == "mercado_pago")
        )
        fp = result.scalars().first()
        if not fp:
            raise ValueError("FormaPago 'mercado_pago' not found. Run migrations to seed it.")
        return fp.id

    async def _get_pedido(self, pedido_id: int) -> Pedido:
        from sqlalchemy.orm import selectinload
        result = await self.session.execute(
            select(Pedido)
            .options(
                selectinload(Pedido.detalles_pedido),
                selectinload(Pedido.usuario)
            )
            .where(Pedido.id == pedido_id)
        )
        pedido = result.scalars().first()
        if not pedido:
            raise ValueError(f"Pedido #{pedido_id} no encontrado.")
        return pedido

    async def _get_estado_nombre(self, estado_id: int) -> str:
        result = await self.session.execute(
            select(EstadoPedido).where(EstadoPedido.id == estado_id)
        )
        ep = result.scalars().first()
        return ep.nombre if ep else "desconocido"

    # ── Public API ────────────────────────────────────────────────────────────

    async def crear_preferencia(
        self,
        pedido_id: int,
        usuario_id: int,
    ) -> dict:
        """
        Create a payment preference via MercadoPago Checkout Pro API.
        Returns preference ID and payment links.
        """
        from app.core.config import get_settings
        settings = get_settings()

        # 1. Validate order exists and is PENDIENTE
        pedido = await self._get_pedido(pedido_id)
        estado_nombre = await self._get_estado_nombre(pedido.estado_id)
        if estado_nombre != "pendiente":
            raise ValueError(
                f"El pedido no está en estado PENDIENTE (estado actual: {estado_nombre}). "
                "Solo se puede pagar un pedido PENDIENTE."
            )

        # 2. Check for already-approved payment
        result = await self.session.execute(
            select(Pago).where(
                Pago.pedido_id == pedido_id,
                Pago.mp_status == "approved",
            )
        )
        if result.scalars().first():
            raise ValueError("Este pedido ya tiene un pago aprobado.")

        # 3. Generate reference keys
        idempotency_key = str(uuid.uuid4())
        external_reference = f"pedido-{pedido.numero_pedido}"

        # 4. Build line items
        items = []
        for d in pedido.detalles_pedido:
            items.append({
                "id": str(d.producto_id),
                "title": d.nombre_snapshot or (d.producto.nombre if d.producto else f"Producto #{d.producto_id}"),
                "quantity": int(d.cantidad),
                "unit_price": float(d.precio_unitario),
                "currency_id": "ARS"
            })

        # Add shipping cost if positive
        if pedido.costo_envio > Decimal("0.00"):
            items.append({
                "id": "envio",
                "title": "Costo de envío",
                "quantity": 1,
                "unit_price": float(pedido.costo_envio),
                "currency_id": "ARS"
            })

        # Base URL de retorno: dynamically use the public ngrok webhook URL if available,
        # otherwise fallback to localhost. Using secure public URL guarantees that
        # MercadoPago renders the "Volver al sitio" button and executes auto_return.
        base_webhook = settings.MERCADOPAGO_WEBHOOK_URL
        if base_webhook and base_webhook.startswith("http"):
            base_retorno = base_webhook.replace("/webhook", "/retorno")
        else:
            base_retorno = "http://localhost:8000/api/v1/pagos/retorno"

        # 5. Build MP preference payload
        payer_email = pedido.usuario.email if pedido.usuario else "comprador@foodstore.com"
        preference_data = {
            "items": items,
            "payer": {
                "email": payer_email,
            },
            "back_urls": {
                "success": f"{base_retorno}?status=success",
                "failure": f"{base_retorno}?status=failure",
                "pending": f"{base_retorno}?status=pending",
            },
            "auto_return": "approved",
            "external_reference": external_reference,
            "metadata": {
                "pedido_id": pedido.id,
                "usuario_id": usuario_id
            }
        }

        # Inject webhook notification URL only if configured and valid
        if settings.MERCADOPAGO_WEBHOOK_URL and settings.MERCADOPAGO_WEBHOOK_URL.startswith("http"):
            preference_data["notification_url"] = settings.MERCADOPAGO_WEBHOOK_URL

        # 6. Call MP SDK to create preference
        mp_response = await self.mp_client.create_preference(preference_data)
        mp_body = mp_response.get("response", {})
        
        # Check for authentication errors inside preference response
        http_status = mp_response.get("status", 0)
        if http_status >= 400:
            error_msg = mp_body.get("message", "Error al crear la preferencia en MercadoPago.")
            logger.error(f"MP preference creation error (status {http_status}): {mp_body}")
            raise ValueError(f"MercadoPago: {error_msg}")

        preference_id = str(mp_body.get("id", ""))
        init_point = str(mp_body.get("init_point", ""))
        sandbox_init_point = str(mp_body.get("sandbox_init_point", ""))

        # 7. Save initial pending Pago record linked by reference
        forma_pago_id = await self._get_forma_pago_mp_id()
        pago = Pago(
            pedido_id=pedido.id,
            forma_pago_id=forma_pago_id,
            monto=pedido.total,
            mp_payment_id=None,
            mp_status="pending",
            estado="pendiente",
            idempotency_key=idempotency_key,
            referencia_externa=external_reference,
            metadata_pago=json.dumps(mp_body),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        self.session.add(pago)
        await self.session.flush()

        return {
            "preference_id": preference_id,
            "init_point": sandbox_init_point or init_point,
            "idempotency_key": idempotency_key
        }

    async def process_payment(
        self,
        payload: PagoCreatePayload,
        usuario_id: int,
    ) -> Pago:
        """
        Create a payment attempt via MP API.
        Returns the Pago record with initial MP status.
        """
        # 1. Validate pedido exists and is PENDIENTE
        pedido = await self._get_pedido(payload.pedido_id)
        estado_nombre = await self._get_estado_nombre(pedido.estado_id)
        if estado_nombre != "pendiente":
            raise ValueError(
                f"El pedido no está en estado PENDIENTE (estado actual: {estado_nombre}). "
                "Solo se puede pagar un pedido PENDIENTE."
            )

        # 2. Check for already-approved payment (prevent re-pay)
        result = await self.session.execute(
            select(Pago).where(
                Pago.pedido_id == payload.pedido_id,
                Pago.mp_status == "approved",
            )
        )
        if result.scalars().first():
            raise ValueError("Este pedido ya tiene un pago aprobado.")

        # 3. Generate idempotency_key
        idempotency_key = str(uuid.uuid4())
        external_reference = f"pedido-{pedido.numero_pedido}"

        # 4. Build MP payment data
        payment_data = {
            "transaction_amount": float(pedido.total),
            "token": payload.token,
            "description": f"FoodStore Pedido {pedido.numero_pedido}",
            "installments": payload.installments,
            "payment_method_id": payload.payment_method_id,
            "issuer_id": payload.issuer_id,
            "payer": {"email": payload.email},
            "external_reference": external_reference,
            "metadata": {"pedido_id": pedido.id, "usuario_id": usuario_id},
        }

        # 5. Call MP API
        mp_response = await self.mp_client.create_payment(payment_data, idempotency_key)
        mp_body = mp_response.get("response", {})
        mp_payment_id = str(mp_body.get("id", ""))
        mp_status = str(mp_body.get("status", "pending"))
        http_status = mp_response.get("status", 0)

        logger.info(
            f"MP payment created: id={mp_payment_id} status={mp_status} "
            f"http={http_status} pedido={pedido.numero_pedido}"
        )

        # 6. Save Pago record
        forma_pago_id = await self._get_forma_pago_mp_id()
        pago = Pago(
            pedido_id=pedido.id,
            forma_pago_id=forma_pago_id,
            monto=pedido.total,
            mp_payment_id=mp_payment_id,
            mp_status=mp_status,
            estado=MP_STATUS_MAP.get(mp_status, mp_status),
            idempotency_key=idempotency_key,
            referencia_externa=external_reference,
            metadata_pago=json.dumps(mp_body),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        self.session.add(pago)
        await self.session.flush()

        # 7. If immediately approved (test cards can do this): advance FSM
        if mp_status == "approved":
            await self._confirm_pedido(pedido.id, usuario_id)

        return pago

    async def _confirm_pedido(self, pedido_id: int, usuario_id: Optional[int] = None) -> None:
        """Advance Pedido FSM to CONFIRMADO (deducts stock atomically)."""
        try:
            pedido_service = PedidoService(self.session)
            await pedido_service.avanzar_estado(
                pedido_id=pedido_id,
                nuevo_estado_nombre="confirmado",
                usuario_id=usuario_id,  # None = system
                nota="Pago aprobado por MercadoPago",
            )
            logger.info(f"Pedido #{pedido_id} avanzado a CONFIRMADO por pago MP aprobado.")
        except Exception as exc:
            logger.error(f"Error advancing Pedido #{pedido_id} to CONFIRMADO: {exc}")
            raise

    async def handle_webhook(self, payload: dict) -> None:
        """
        Process an IPN notification from MercadoPago.
        Always queries MP API to get the real status (RN-PA04).
        """
        # Extract mp_payment_id from various IPN formats
        mp_payment_id: Optional[str] = None

        # Newer format: {"type": "payment", "data": {"id": "123"}}
        if payload.get("type") == "payment" and payload.get("data"):
            mp_payment_id = str(payload["data"].get("id", ""))
        # Older IPN format: {"topic": "payment", "id": "123"}
        elif payload.get("topic") == "payment":
            mp_payment_id = str(payload.get("id", ""))

        if not mp_payment_id:
            logger.warning(f"Webhook: no mp_payment_id found in payload: {payload}")
            return

        # Fetch real payment status from MP (RN-PA04)
        try:
            mp_response = await self.mp_client.get_payment(mp_payment_id)
            mp_body = mp_response.get("response", {})
            mp_status = mp_body.get("status", "")
            external_reference = mp_body.get("external_reference", "")
        except Exception as exc:
            logger.error(f"Webhook: error fetching payment {mp_payment_id} from MP: {exc}")
            return

        # Find local Pago record
        result = await self.session.execute(
            select(Pago).where(Pago.mp_payment_id == mp_payment_id)
        )
        pago = result.scalars().first()

        if not pago and external_reference:
            logger.info(
                f"Webhook: no local Pago found for mp_payment_id={mp_payment_id}. "
                f"Attempting search by referencia_externa={external_reference}"
            )
            # Prioritize the Pago record that hasn't been associated with an MP ID yet
            result = await self.session.execute(
                select(Pago).where(
                    Pago.referencia_externa == external_reference,
                    Pago.mp_payment_id == None
                )
            )
            pago = result.scalars().first()

            # Fallback to any Pago with this reference
            if not pago:
                result = await self.session.execute(
                    select(Pago).where(Pago.referencia_externa == external_reference)
                )
                pago = result.scalars().first()

            if pago:
                logger.info(
                    f"Webhook: found local Pago ID={pago.id} via referencia_externa={external_reference}. "
                    f"Associating mp_payment_id={mp_payment_id}"
                )
                pago.mp_payment_id = mp_payment_id

        if not pago:
            logger.warning(
                f"Webhook: no local Pago found for mp_payment_id={mp_payment_id}. "
                f"external_reference={external_reference}"
            )
            return

        # Idempotency: skip if already processed with same status
        if pago.mp_status == mp_status:
            logger.info(f"Webhook: idempotent — pago {pago.id} already has status {mp_status}")
            return

        # Update Pago record
        pago.mp_status = mp_status
        pago.estado = MP_STATUS_MAP.get(mp_status, mp_status)
        pago.metadata_pago = json.dumps(mp_body)
        pago.updated_at = datetime.utcnow()

        # If approved: advance Pedido FSM (RN-PA05)
        if mp_status == "approved":
            await self._confirm_pedido(pago.pedido_id, usuario_id=None)

        logger.info(f"Webhook: Pago #{pago.id} updated to mp_status={mp_status}")

    async def get_pagos_by_pedido(self, pedido_id: int) -> list[Pago]:
        """Return all payment attempts for a given order (newest first)."""
        result = await self.session.execute(
            select(Pago)
            .where(Pago.pedido_id == pedido_id)
            .order_by(Pago.created_at.desc())
        )
        return list(result.scalars().all())
