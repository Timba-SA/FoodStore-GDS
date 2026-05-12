# Proposal: 06-pagos-mercadopago

## Problem
Currently, orders are created in `PENDIENTE` state with their totals calculated and their delivery address captured. However, there is no payment gateway integrated. In order to proceed to `CONFIRMADO` (which deducts stock) and allow fulfillment, the application needs to process payments via MercadoPago safely. This requires PCI DSS SAQ-A compliance (the server never touches card numbers), idempotency, and asynchronous webhook handling to advance the order state.

## Proposed Solution
We will integrate MercadoPago using the Custom Checkout approach.
The flow will be:
1. **Frontend**: Render the `@mercadopago/sdk-react` payment form. The user inputs their credit card.
2. **Frontend**: MP's script tokenizes the card directly and returns a `token` to the frontend.
3. **Frontend → Backend**: Frontend calls `POST /api/v1/pagos/crear` with `pedido_id` and the `token` (plus issuer_id, payment_method_id, installments).
4. **Backend**: Generates a UUID `idempotency_key`. Calls the MP SDK `mercadopago.Payment().create()`.
5. **Backend**: Saves a `Pago` record with the MP payment ID and initial status (`pending`, `in_process`, etc.).
6. **MP → Backend (Webhook)**: Asynchronously, MP sends an IPN (Webhook) to `POST /api/v1/pagos/webhook`.
7. **Backend**: Verifies webhook signature, queries the actual payment status from MP API. If the status is `approved`, the backend automatically calls `pedido_service.avanzar_estado(id, "confirmado")`, deducting the stock.

## Architecture

### Database Models
- `Pago`: `id`, `pedido_id` (FK), `monto`, `mp_payment_id` (string), `mp_status` (string), `idempotency_key` (string, unique), `external_reference` (string).
  - Relationship 1:N from Pedido to Pago (an order can have multiple payment attempts, but only one approved).

### Services
- `MercadoPagoService`: Wrapper around MP SDK to `create_payment()` and `get_payment()`.
- `PagoService`: Creates local `Pago` records and processes webhook IPN events to update the `Pedido` status.

### Frontend Integration
- Use `@mercadopago/sdk-react` for the `<CardPayment />` UI.
- Add a new route `CheckoutPage` (/dashboard/pedidos/:id/pagar) where the user pays for a `PENDIENTE` order.
- Implement polling (or manual refresh) to see the transition from `PENDIENTE` to `CONFIRMADO`.

## Alternatives Considered
- **MercadoPago Checkout Pro (Redirect)**: Simpler to implement but takes the user out of our UI, hurting UX. We opt for Custom Checkout (API) with `@mercadopago/sdk-react`.
- **Synchronous vs Asynchronous Confirmation**: We will rely primarily on Webhooks (IPN) to advance the FSM state, as payment providers' synchronous responses can timeout or enter 'in_process' states.

## Risks & Tradeoffs
- **Webhook Reliability**: If our server is not publicly accessible (e.g. running on localhost without Ngrok), MP cannot hit the webhook. For local testing, we must mock the webhook call or use Ngrok.
- **Race conditions**: Webhook could arrive while the user is still waiting for the synchronous HTTP response. Using `idempotency_key` and DB transactions will prevent double-processing.
