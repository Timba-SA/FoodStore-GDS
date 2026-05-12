# Implementation Tasks: 06-pagos-mercadopago

## Phase 1: Environment & Database
- [ ] 1.1 Add MP env vars to `backend/app/core/config.py` (`MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`) and `.env.example`.
- [ ] 1.2 Create `backend/app/db/models/pago.py` with the `Pago` model.
- [ ] 1.3 Add the `Pago` back-population relationship to `app/db/models/pedido.py`.
- [ ] 1.4 Generate Alembic migration for `pagos` table and apply it.

## Phase 2: Backend Services (MercadoPago)
- [ ] 2.1 Create `backend/app/modules/pagos/schemas.py` for payment requests and webhook payloads.
- [ ] 2.2 Create `backend/app/modules/pagos/mp_client.py` wrapping the `mercadopago.SDK`. Implement `create_payment` and `get_payment`.
- [ ] 2.3 Create `backend/app/modules/pagos/service.py`. Implement `process_payment` (saves DB record, handles idempotency).
- [ ] 2.4 Implement `handle_webhook` in `service.py`: validates signature, queries MP, updates DB, and conditionally advances the FSM to `CONFIRMADO` via `PedidoService`.

## Phase 3: Backend API (Router)
- [ ] 3.1 Create `backend/app/modules/pagos/router.py`. Add `POST /` (process payment), `POST /webhook`, and `GET /pedido/{id}`.
- [ ] 3.2 Register the `pagos_router` in `backend/app/main.py`.

## Phase 4: Frontend SDK & Store
- [ ] 4.1 Install `@mercadopago/sdk-react` via npm.
- [ ] 4.2 Add `VITE_MP_PUBLIC_KEY` to `frontend/.env`.
- [ ] 4.3 Create `frontend/src/entities/pago/` (types, api, hooks) for TanStack Query mutations.

## Phase 5: Frontend UI
- [ ] 5.1 Create `frontend/src/features/pagos/PaymentForm.tsx` integrating the `<Payment />` component from `@mercadopago/sdk-react`.
- [ ] 5.2 Create `frontend/src/pages/CheckoutPage.tsx`. Route: `/dashboard/pedidos/:id/pagar`. Fetch Pedido, if pending show PaymentForm, if confirmed show Success screen.
- [ ] 5.3 Update `MisPedidosPage.tsx` and `CheckoutModal.tsx` to redirect to `/dashboard/pedidos/:id/pagar` after a successful order creation.

## Phase 6: Testing & Validation
- [ ] 6.1 Test missing env variables don't crash the server (graceful degradation).
- [ ] 6.2 Unit tests: Webhook signature validation.
- [ ] 6.3 E2E test (manual): Create order, pay with test card, verify FSM advances to CONFIRMADO.
