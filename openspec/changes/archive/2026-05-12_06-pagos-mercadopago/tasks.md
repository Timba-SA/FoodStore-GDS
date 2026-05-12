# Implementation Tasks: 06-pagos-mercadopago

## Phase 1: Environment & Database
- [x] 1.1 Add MP env vars to `backend/app/core/config.py` (`MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`) and `.env.example`.
- [x] 1.2 Create `backend/app/db/models/pago.py` with the `Pago` model. (already existed, extended with MP fields)
- [x] 1.3 Add the `Pago` back-population relationship to `app/db/models/pedido.py`. (already existed)
- [x] 1.4 Generate Alembic migration for `pagos` MP fields and apply it. (migration `b2c3d4e5f6a7`)

## Phase 2: Backend Services (MercadoPago)
- [x] 2.1 Create `backend/app/modules/pagos/schemas.py` for payment requests and webhook payloads.
- [x] 2.2 Create `backend/app/modules/pagos/mp_client.py` wrapping the `mercadopago.SDK`. Implement `create_payment` and `get_payment`.
- [x] 2.3 Create `backend/app/modules/pagos/service.py`. Implement `process_payment` (saves DB record, handles idempotency).
- [x] 2.4 Implement `handle_webhook` in `service.py`: validates signature, queries MP, updates DB, and conditionally advances the FSM to `CONFIRMADO` via `PedidoService`.

## Phase 3: Backend API (Router)
- [x] 3.1 Create `backend/app/modules/pagos/router.py`. Add `POST /` (process payment), `POST /webhook`, and `GET /pedido/{id}`.
- [x] 3.2 Register the `pagos_router` in `backend/app/main.py`.

## Phase 4: Frontend SDK & Store
- [x] 4.1 Install `@mercadopago/sdk-react` via npm.
- [x] 4.2 Add `VITE_MP_PUBLIC_KEY` to `frontend/.env`.
- [x] 4.3 Create `frontend/src/entities/pago/` (types, api, hooks) for TanStack Query mutations.

## Phase 5: Frontend UI
- [x] 5.1 Create `frontend/src/features/pagos/PaymentForm.tsx` integrating the `<CardPayment />` component from `@mercadopago/sdk-react`.
- [x] 5.2 Create `frontend/src/pages/CheckoutPage.tsx`. Route: `/dashboard/pedidos/:id/pagar`.
- [x] 5.3 Updated `MisPedidosPage.tsx` to show 💳 Pagar button on PENDIENTE orders.

## Phase 6: Testing & Validation
- [ ] 6.1 Test missing env variables don't crash the server (graceful degradation).
- [ ] 6.2 Unit tests: Webhook signature validation.
- [ ] 6.3 E2E test (manual): Create order, pay with test card, verify FSM advances to CONFIRMADO.
