# Exploration: 07-admin-dashboard-metricas

## Context
We need to implement the Admin Dashboard and Metrics for the FoodStore project (Epic 07). This is the final major epic that provides administrators with tools to manage the entire platform and view business metrics.

## Current State Analysis
### Backend
- **Admin Module**: Currently exists (`backend/app/modules/admin/`) but only has `PUT /usuarios/{user_id}/roles`.
- **Missing Endpoints**:
  - Full User CRUD (`GET` all with pagination, `GET` by ID, `POST` create, `PUT` update, `DELETE` soft).
  - Metrics endpoints: `/metricas/dashboard`, `/metricas/ventas`, `/metricas/productos-top`, `/metricas/estados-pedidos`.
  - Deleted records endpoint: `/registros-eliminados`.
  - Profile endpoints: `/perfil` (GET, PUT, POST password).
- **Database**:
  - We already use `SQLModel` with a `deleted_at` field (AuditMixin) on most models, so soft delete is natively supported.
  - Metrics will require querying `pedidos`, `pagos`, `detalles_pedido`, and `productos` with aggregations.

### Frontend
- **Existing Pages**:
  - `AdminProductosPage.tsx`, `CategoriasPage.tsx`, `IngredientesPage.tsx` already exist.
  - `MisPedidosPage.tsx` exists for users. We need an `/admin/pedidos` page or to adapt it.
- **Missing Pages**:
  - `/admin/dashboard` (Metrics and charts).
  - `/admin/usuarios` (User CRUD).
  - `/admin/stock` (Stock management).
  - `/perfil` (Profile management).
- **Libraries**:
  - We need a charting library. The epic suggests `recharts`. We should install it.
  - `lucide-react` is already used for icons.
  - `@tanstack/react-query` is already used for data fetching.

## Technical Requirements
1. **Metrics Aggregation**: The backend needs efficient SQLAlchemy aggregation queries to calculate total sales, orders today, top products, and status distribution.
2. **User Management**: The admin needs a full CRUD for users. Passwords must be hashed when creating manual users. Soft delete must set `deleted_at`.
3. **Profile**: Users need to see and edit their own data. Changing passwords requires verifying the old password.
4. **Stock Management**: A streamlined table just for updating `stock` of products quickly.

## Options & Decisions
- **Metrics Queries**: Should we use raw SQL or SQLAlchemy ORM?
  *Decision*: Use SQLAlchemy async ORM with `func` (e.g., `func.sum`, `func.count`) for type safety and consistency.
- **Charts Library**:
  *Decision*: Use `recharts` as requested in the epic. It's lightweight, React-friendly, and easy to style with Tailwind.
- **Admin Pedidos**:
  *Decision*: Create a dedicated `AdminPedidosPage.tsx` that lists all orders (not just the user's) and allows changing their state (PENDIENTE -> EN_PREPARACION -> EN_CAMINO -> ENTREGADO).

## Risks
- Aggregation queries can be slow if not indexed. We should ensure we are querying efficiently, though for this scale it should be fine.
- Soft delete implementation on users means we shouldn't physically delete them, which is already handled by `AuditMixin`. However, we must ensure unique constraints (like email) handle soft-deleted users correctly (e.g., allowing a new user with the same email if the old one is deleted, or just restoring the old one).

## Conclusion
The backend work consists of expanding the `admin` module to include user management, creating a new `metricas` module (or adding to admin) for aggregations, and a `perfil` module. The frontend requires installing `recharts` and building the new views.
