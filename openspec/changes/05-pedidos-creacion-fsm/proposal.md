# SDD Proposal: 05-pedidos-creacion-fsm

## 1. Context
The user has requested the implementation of Epic 05: Order Creation and Finite State Machine (FSM) (`05-pedidos-creacion-fsm`). This module handles the conversion of a client's cart into a concrete order in the database, enforces strict atomic transactions (Unit of Work), validates stock with concurrency controls (`SELECT FOR UPDATE`), and implements an order state machine.

## 2. Proposed Architecture

### 2.1 Schema Gap Analysis
I have reviewed the existing database models (`app/db/models/pedido.py`). There are missing fields required by the user stories in `CHANGES.md`:
1. `DetallePedido.personalizacion`: The cart supports excluding ingredients, but the DB model has no column to store these exclusions.
2. `Pedido.direccion_snapshot`: Since `DireccionEntrega` doesn't support soft-delete (as discovered in Epic 03), we need to save a snapshot of the delivery address at the time of order creation (US-038).
3. `HistorialEstadoPedido`: The current model only stores `estado_id`. It doesn't store `estado_desde` or `usuario_id` as suggested in `CHANGES.md`.

**Decision**: Instead of compromising core business rules (like cart exclusions), we will create a single Alembic migration to add the missing columns:
- Add `personalizacion` (JSON or ARRAY) to `DetallePedido`.
- Add `direccion_snapshot` (JSON) to `Pedido`.
- Add `forma_pago_id` to `Pedido` (currently it uses a separate `Pago` table, but the creation endpoint needs to associate the payment method. We can just create the `Pago` record during order creation).

### 2.2 Backend Architecture
We will use the **Unit of Work (UoW)** pattern for the order creation endpoint to ensure atomicity.
- **Service**: `PedidoService`.
- **Creation Flow (`POST /api/v1/pedidos`)**:
  1. Validate the user and the requested `direccion_entrega_id`.
  2. Start a database transaction.
  3. For each cart item, fetch the `Producto` locking the row (`with_for_update()`).
  4. Verify `producto.activo == True` and `producto.stock >= item.cantidad`.
  5. Calculate totals.
  6. Insert `Pedido` (estado = PENDIENTE) and `direccion_snapshot`.
  7. Insert `DetallePedido` items with `precio_unitario` (snapshot) and `personalizacion`.
  8. Insert `HistorialEstadoPedido` indicating the creation.
  9. Insert `Pago` record in "pendiente" state.
  10. Commit transaction.
- **State Machine (`PATCH /api/v1/pedidos/{id}/estado`)**:
  - Enforce transitions: PENDIENTE → CONFIRMADO → EN_PREP → EN_CAMINO → ENTREGADO.
  - If PENDIENTE → CONFIRMADO: Deduct stock atomically.
  - Record transition in `HistorialEstadoPedido`.

### 2.3 Frontend Architecture
- **Checkout Flow**: A modal or dedicated page that receives the cart, allows selecting a delivery address (from Epic 03), selecting a payment method, and submitting the order.
- **Order History (`/dashboard/pedidos`)**: A list of the user's orders.
- **Order Detail**: Shows the items, the custom exclusions, the subtotal, and a visual timeline of the order's state.

## 3. Trade-offs and Considerations
- **Stock Deduction Timing**: The spec says "Si PENDIENTE → CONFIRMADO: decrementar stock". This means stock is *not* reserved while the order is PENDIENTE. This avoids locking stock for abandoned checkouts, but means an order could be cancelled by the admin if stock runs out before confirmation. We will strictly follow this rule.
- **Alembic Migrations**: Unlike Epic 03, we *must* create a migration here, otherwise we lose the cart's ingredient exclusions which were just built in Epic 04.

## 4. Next Steps
If this proposal is approved, we will proceed to generate the `design.md` and `tasks.md` specs.
