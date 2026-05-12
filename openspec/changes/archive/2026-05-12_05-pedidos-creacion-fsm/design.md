# SDD Design: 05-pedidos-creacion-fsm

## 1. Database Schema Updates (Alembic)
Since the `CHANGES.md` requires snapshots and exclusions, we must modify the database schema:

**Table: `pedidos`**
- Add `direccion_snapshot: JSON` (or JSONB in Postgres) to hold `{ calle, numero, ciudad, provincia... }`.
- Add `nombre_snapshot: JSON` to `detalles_pedido`? Wait, `DetallePedido` needs the snapshot. Let's just add `snapshot_producto: JSON` to `detalles_pedido` to capture the name and details at the time of purchase.
- Add `personalizacion: JSON` to `detalles_pedido` to store the array of excluded ingredient IDs `[1, 5]`.

**Table: `historial_estados_pedido`**
- Add `usuario_id: int` (nullable) to audit who made the state transition.
- Add `estado_desde_id: int` (nullable) to clearly show the transition `A -> B`. (Wait, if `estado_id` already exists, maybe we just leave it as append-only and infer `estado_desde` from the previous row. Let's stick to adding `usuario_id` for accountability).

## 2. Backend Architecture

### 2.1 Domain Logic (`app/modules/pedidos/service.py`)
- **create_pedido(payload)**: 
  - Starts SQLAlchemy `Session`.
  - Fetches the user's selected `DireccionEntrega`. Generates the snapshot dict.
  - Queries `FormaPago` to ensure it exists.
  - Iterates `payload.items`: fetches `Producto` with `with_for_update()`.
  - Checks `producto.activo` and `producto.stock >= item.cantidad`.
  - Creates `Pedido` instance (Estado = 1/PENDIENTE).
  - Creates `DetallePedido` instances mapping the cart items and `personalizacion`.
  - Creates `Pago` instance.
  - Creates `HistorialEstadoPedido`.
  - Commits the transaction. If any error, rolls back and raises HTTP 400.
- **avanzar_estado(pedido_id, nuevo_estado_id, usuario_id)**:
  - FSM Matrix:
    - 1 (PENDIENTE) → 2 (CONFIRMADO)
    - 2 (CONFIRMADO) → 3 (EN_PREP)
    - 3 (EN_PREP) → 4 (EN_CAMINO)
    - 4 (EN_CAMINO) → 5 (ENTREGADO)
  - If PENDIENTE → CONFIRMADO: Queries `DetallePedido` and `Producto` (`with_for_update()`), checks stock again, and deducts it. If no stock, raises exception.
  - Saves new `HistorialEstadoPedido`.
- **cancelar_pedido(pedido_id, usuario_id)**:
  - Only allowed if current state is PENDIENTE or CONFIRMADO (or EN_PREP if ADMIN).
  - If state was CONFIRMADO (meaning stock was deducted), iterates details and adds stock back to `Producto`.
  - Changes state to CANCELADO.

### 2.2 Routers (`app/modules/pedidos/router.py`)
- `POST /api/v1/pedidos`: Create order.
- `GET /api/v1/pedidos`: List orders (filters by user if CLIENT, all if ADMIN).
- `GET /api/v1/pedidos/{id}`: Detailed view with history.
- `PATCH /api/v1/pedidos/{id}/estado`: Advance state.
- `DELETE /api/v1/pedidos/{id}`: Cancel order.

## 3. Frontend Architecture

### 3.1 API & Types
- Types for `Pedido`, `DetallePedido`, `HistorialEstado`, `PedidoCreatePayload`.
- `useCreatePedido` mutation: calls backend, on success calls `cartStore.clearCart()`.

### 3.2 UI Components
- **Checkout Modal/Drawer**: 
  - Shown when clicking "Proceder al pago" in the cart.
  - Allows selecting a delivery address (using `useDirecciones`).
  - Allows selecting a payment method (hardcoded or from backend).
  - Confirms total and submits.
- **MisPedidosPage (`/dashboard/pedidos`)**:
  - List of past orders for the user.
  - State badges (color-coded).
- **PedidoDetailModal**:
  - Shows line items with snapshots.
  - Shows the timeline of `historial_estados` (e.g. circles connected by lines).
  - If order is PENDIENTE, shows "Cancelar Pedido" button.

## 4. Dependencies
- Alembic for the migration.
- `zustand` (already managing the cart).
- `@tanstack/react-query` for API calls.
