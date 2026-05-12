"""
Pagos router.

Endpoints:
  POST   /pagos              — Process payment (requires auth)
  POST   /pagos/webhook      — MP IPN webhook (public, validates x-signature)
  GET    /pagos/pedido/{id}  — List payment attempts for an order
"""

import logging
import hashlib
import hmac
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.dependencies import get_db
from app.modules.auth.router import get_current_user
from app.modules.pagos.schemas import PagoCreatePayload, PagoResponse
from app.modules.pagos.service import PagoService
from app.modules.pagos.mp_client import MercadoPagoClient

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/pagos", tags=["pagos"])


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_mp_client() -> MercadoPagoClient:
    """Create MP client; raises 503 if token is not configured."""
    settings = get_settings()
    if not settings.MERCADOPAGO_ACCESS_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Módulo de pagos no configurado. Contactar al administrador.",
        )
    return MercadoPagoClient(settings.MERCADOPAGO_ACCESS_TOKEN)


def _verify_mp_signature(request_body: bytes, x_signature: str, x_request_id: str) -> bool:
    """
    Verify MercadoPago webhook signature.
    Docs: https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
    """
    secret = get_settings().MERCADOPAGO_WEBHOOK_SECRET
    if not secret:
        # If no secret configured, skip validation (dev mode)
        logger.warning("MP_WEBHOOK_SECRET not set — skipping signature validation!")
        return True

    try:
        # MP signature format: "ts=<timestamp>,v1=<hash>"
        parts = {p.split("=")[0]: p.split("=")[1] for p in x_signature.split(",")}
        ts = parts.get("ts", "")
        v1 = parts.get("v1", "")
        manifest = f"id:{x_request_id};request-id:{x_request_id};ts:{ts};"
        expected = hmac.new(
            secret.encode(),
            manifest.encode(),
            hashlib.sha256,
        ).hexdigest()
        return hmac.compare_digest(expected, v1)
    except Exception as exc:
        logger.warning(f"MP signature validation error: {exc}")
        return False


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post(
    "",
    response_model=PagoResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Process payment for an order",
)
async def process_payment(
    data: PagoCreatePayload,
    session: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    mp_client = _get_mp_client()
    service = PagoService(session, mp_client)
    try:
        pago = await service.process_payment(data, usuario_id=current_user.id)
        await session.commit()
        return PagoResponse(
            id=pago.id,
            pedido_id=pago.pedido_id,
            monto=pago.monto,
            mp_payment_id=pago.mp_payment_id,
            mp_status=pago.mp_status,
            estado=pago.estado,
            idempotency_key=pago.idempotency_key,
            referencia_externa=pago.referencia_externa,
            created_at=pago.created_at,
        )
    except ValueError as exc:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception as exc:
        await session.rollback()
        logger.error(f"Error processing payment: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al procesar el pago: {exc}",
        )


@router.post(
    "/webhook",
    status_code=status.HTTP_200_OK,
    summary="MercadoPago IPN webhook (public endpoint)",
)
async def mp_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_db),
):
    """
    Receives IPN notifications from MercadoPago.
    Validates signature, then processes in background (RN-PA03: respond 200 quickly).
    """
    body = await request.body()
    x_signature = request.headers.get("x-signature", "")
    x_request_id = request.headers.get("x-request-id", "")

    # Validate signature (skip if secret not configured)
    if x_signature and not _verify_mp_signature(body, x_signature, x_request_id):
        logger.warning("MP webhook: invalid signature rejected")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid webhook signature",
        )

    try:
        payload = await request.json()
    except Exception:
        payload = {}

    # Process asynchronously so we can respond 200 immediately (RN-PA03)
    async def process_webhook():
        try:
            mp_client = _get_mp_client()
            service = PagoService(session, mp_client)
            await service.handle_webhook(payload)
            await session.commit()
        except Exception as exc:
            await session.rollback()
            logger.error(f"Webhook processing error: {exc}")

    background_tasks.add_task(process_webhook)
    return {"status": "received"}


@router.get(
    "/pedido/{pedido_id}",
    response_model=list[PagoResponse],
    status_code=status.HTTP_200_OK,
    summary="List payment attempts for an order",
)
async def get_pagos(
    pedido_id: int,
    session: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    mp_client = _get_mp_client()
    service = PagoService(session, mp_client)
    try:
        pagos = await service.get_pagos_by_pedido(pedido_id)
        return [
            PagoResponse(
                id=p.id,
                pedido_id=p.pedido_id,
                monto=p.monto,
                mp_payment_id=p.mp_payment_id,
                mp_status=p.mp_status,
                estado=p.estado,
                idempotency_key=p.idempotency_key,
                referencia_externa=p.referencia_externa,
                created_at=p.created_at,
            )
            for p in pagos
        ]
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        )
