# Design: 06-pagos-mercadopago

## Architecture
This change touches the Backend (FastAPI, Alembic, PostgreSQL) and Frontend (React, TanStack Query).

### 1. Database Layer (`backend/app/db/models/pago.py`)
```python
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import Optional
from decimal import Decimal

class Pago(SQLModel, table=True):
    __tablename__ = "pagos"

    id: Optional[int] = Field(default=None, primary_key=True)
    pedido_id: int = Field(foreign_key="pedidos.id", index=True)
    monto: Decimal = Field(max_digits=10, decimal_places=2)
    
    mp_payment_id: Optional[str] = Field(default=None, index=True)
    mp_status: str = Field(default="pending")  # approved, rejected, in_process
    idempotency_key: str = Field(unique=True, index=True)
    external_reference: str = Field(index=True) # UUID mapped to pedido
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
```
- A relationship must be added to `Pedido` (`pagos = Relationship(back_populates="pedido")`).

### 2. Backend Services
**`app/core/config.py`**:
- Add `MP_ACCESS_TOKEN` and `MP_WEBHOOK_SECRET` configuration variables.

**`app/modules/pagos/service.py`**:
- `MercadoPagoClient`: Initializes `mercadopago.SDK(access_token)`. Exposes `create_payment(data)` and `get_payment(id)`.
- `PagoService`:
  - `process_payment(pedido_id, token, ...)`: Validates order state. Generates `idempotency_key`. Calls `MercadoPagoClient`. Saves `Pago` record.
  - `handle_webhook(data)`: Verifies MP signature (x-signature header). Extracts `payment.id`. Calls MP to verify. Updates local `Pago`. If `approved`, calls `PedidoService.avanzar_estado("confirmado")`.

**`app/modules/pagos/router.py`**:
- `POST /` (Process Payment): Called by frontend. Returns status.
- `POST /webhook` (MP IPN): Open endpoint (no JWT auth) but validates x-signature.
- `GET /pedido/{pedido_id}`: Returns all payment attempts for an order.

### 3. Frontend Layer
**`frontend/package.json`**:
- `npm install @mercadopago/sdk-react`

**`frontend/src/entities/pago/`**:
- `api.ts`, `types.ts`, `hooks.ts`. (Includes `useProcessPayment` mutation).

**`frontend/src/features/pagos/PaymentForm.tsx`**:
- Initializes `<Payment />` component from MP SDK using `initMercadoPago(PUBLIC_KEY)`.
- On success callback, calls our `POST /api/v1/pagos` endpoint with the token.

**`frontend/src/pages/CheckoutPage.tsx`**:
- Route: `/dashboard/pedidos/:id/pagar`.
- Loads Pedido. If `PENDIENTE`, shows `PaymentForm`.
- If already `CONFIRMADO` (polled via React Query), shows success screen.

## Integration & Safety
- **PCI Compliance**: We only receive the `token` (and issuer/method IDs) from the frontend. The raw PAN (card number) is sent directly from the browser to MP's servers.
- **Idempotency**: MP SDK respects the `X-Idempotency-Key` header. If a user double-clicks, the second request yields the exact same MP response without creating a duplicate charge.
- **Webhook Sec**: IPNs must validate the `x-signature` header using `MP_WEBHOOK_SECRET` to prevent spoofed `approved` events.
