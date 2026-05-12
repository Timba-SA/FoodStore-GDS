"""
MercadoPago SDK wrapper.

Provides async-friendly methods to interact with the MercadoPago Payments API.
The SDK itself is synchronous, so we run it in a thread executor for safety
inside async route handlers.
"""

import logging
from typing import Any, Optional
import asyncio
from functools import partial

import mercadopago

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class MercadoPagoClient:
    """Lightweight wrapper around the mercadopago SDK Payment resource."""

    def __init__(self, access_token: Optional[str] = None):
        token = access_token or get_settings().MERCADOPAGO_ACCESS_TOKEN
        if not token:
            raise RuntimeError(
                "MERCADOPAGO_ACCESS_TOKEN no configurado. "
                "Agregalo al .env para habilitar el módulo de pagos."
            )
        self._sdk = mercadopago.SDK(token)

    # ── Sync helpers (called inside executor) ────────────────────────────────

    def _create_payment_sync(self, payment_data: dict, idempotency_key: str) -> dict:
        """Create a payment via MP API (synchronous)."""
        request_options = mercadopago.config.RequestOptions()
        request_options.custom_headers = {
            "x-idempotency-key": idempotency_key,
        }
        response = self._sdk.payment().create(payment_data, request_options)
        return response

    def _get_payment_sync(self, payment_id: str) -> dict:
        """Fetch a payment by ID from MP API (synchronous)."""
        response = self._sdk.payment().get(payment_id)
        return response

    # ── Async wrappers ────────────────────────────────────────────────────────

    async def create_payment(self, payment_data: dict, idempotency_key: str) -> dict:
        """Create a payment (runs in thread executor to avoid blocking)."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            partial(self._create_payment_sync, payment_data, idempotency_key),
        )

    async def get_payment(self, payment_id: str) -> dict:
        """Fetch a payment by ID (runs in thread executor)."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            partial(self._get_payment_sync, payment_id),
        )


def get_mp_client() -> MercadoPagoClient:
    """FastAPI dependency: returns a configured MercadoPagoClient."""
    return MercadoPagoClient()
