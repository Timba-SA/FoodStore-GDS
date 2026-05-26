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
from app.modules.pagos.schemas import (
    PagoCreatePayload,
    PagoResponse,
    PreferenciaCreatePayload,
    PreferenciaResponse,
)
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


def _verify_mp_signature(data_id: str, x_signature: str, x_request_id: str) -> bool:
    """
    Verify MercadoPago webhook signature.
    Docs: https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks

    The manifest template per MP docs:
        id:[data.id_url];request-id:[x-request-id_header];ts:[ts_header];
    """
    secret = get_settings().MERCADOPAGO_WEBHOOK_SECRET
    if not secret:
        # If no secret configured, skip validation (dev mode)
        logger.warning("MP_WEBHOOK_SECRET not set — skipping signature validation!")
        return True

    if not x_signature:
        logger.warning("MP webhook: no x-signature header present")
        return False

    try:
        # MP signature format: "ts=<timestamp>,v1=<hash>"
        parts = {}
        for p in x_signature.split(","):
            kv = p.strip().split("=", 1)
            if len(kv) == 2:
                parts[kv[0]] = kv[1]
        ts = parts.get("ts", "")
        v1 = parts.get("v1", "")

        if not ts or not v1:
            logger.warning(f"MP webhook: incomplete signature — ts={ts!r} v1={v1!r}")
            return False

        # Build manifest per MP documentation
        manifest = f"id:{data_id};request-id:{x_request_id};ts:{ts};"
        expected = hmac.new(
            secret.encode(),
            manifest.encode(),
            hashlib.sha256,
        ).hexdigest()
        is_valid = hmac.compare_digest(expected, v1)
        if not is_valid:
            logger.warning(f"MP webhook signature mismatch: data_id={data_id}")
        return is_valid
    except Exception as exc:
        logger.warning(f"MP signature validation error: {exc}")
        return False


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post(
    "/crear-preferencia",
    response_model=PreferenciaResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a MercadoPago Checkout Pro Preference",
)
async def crear_preferencia(
    data: PreferenciaCreatePayload,
    session: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    mp_client = _get_mp_client()
    service = PagoService(session, mp_client)
    try:
        res = await service.crear_preferencia(data.pedido_id, usuario_id=current_user.id)
        await session.commit()
        return PreferenciaResponse(
            preference_id=res["preference_id"],
            init_point=res["init_point"],
            idempotency_key=res["idempotency_key"]
        )
    except ValueError as exc:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception as exc:
        await session.rollback()
        logger.error(f"Error creating MP preference: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear la preferencia de pago: {exc}",
        )


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

    MP sends webhooks in two formats:
    - New: POST /webhook?data.id=123&type=payment  (with x-signature)
    - Old: POST /webhook?id=123&topic=payment       (legacy IPN)
    """
    # Extract data_id from query params (MP sends it as ?data.id=xxx or ?id=xxx)
    data_id = request.query_params.get("data.id", "") or request.query_params.get("id", "")

    x_signature = request.headers.get("x-signature", "")
    x_request_id = request.headers.get("x-request-id", "")

    logger.info(
        f"MP webhook received: data_id={data_id} "
        f"type={request.query_params.get('type', request.query_params.get('topic', 'unknown'))} "
        f"has_signature={'yes' if x_signature else 'no'}"
    )

    # Validate signature if present
    if x_signature:
        if not _verify_mp_signature(data_id, x_signature, x_request_id):
            logger.warning(f"MP webhook: invalid signature rejected for data_id={data_id}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid webhook signature",
            )
    else:
        logger.warning("MP webhook: no signature — accepting in dev mode")

    try:
        payload = await request.json()
    except Exception:
        payload = {}

    # Enrich payload with query params for old-format IPN compatibility
    if not payload.get("data") and data_id:
        topic = request.query_params.get("topic", "")
        if topic == "payment":
            payload = {"type": "payment", "data": {"id": data_id}}
        elif topic == "merchant_order":
            payload = {"type": "merchant_order", "data": {"id": data_id}}

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


@router.get(
    "/retorno",
    summary="MercadoPago payment return redirect proxy",
)
async def pagos_retorno(
    request: Request,
    status: str = "success",
):
    """
    Redirect proxy to bypass MercadoPago's restriction on localhost back_urls.
    Returns an HTML page that auto-redirects the browser to the local React frontend.
    Uses HTML meta-refresh + JS redirect instead of HTTP 302 to bypass
    the ngrok free-tier interstitial warning page.
    """
    from fastapi.responses import HTMLResponse
    from urllib.parse import urlencode

    # Forward all MP query params (collection_id, payment_id, etc.)
    params = dict(request.query_params)
    params["payment_status"] = params.pop("status", status)

    frontend_url = "http://localhost:5173/dashboard/pedidos"
    redirect_url = f"{frontend_url}?{urlencode(params)}"

    html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta http-equiv="refresh" content="0;url={redirect_url}">
    <title>Redirigiendo...</title>
</head>
<body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f8fafc">
    <div style="text-align:center">
        <p style="font-size:1.1rem;color:#475569">Redirigiendo a FoodStore...</p>
        <p style="font-size:0.85rem;color:#94a3b8">Si no sos redirigido automáticamente, <a href="{redirect_url}">hacé clic acá</a>.</p>
    </div>
    <script>window.location.href = "{redirect_url}";</script>
</body>
</html>"""
    return HTMLResponse(content=html, headers={"ngrok-skip-browser-warning": "true"})
