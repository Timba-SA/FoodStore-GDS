# Proposal: 07-admin-dashboard-metricas

## 1. Goal
Implement a comprehensive administration panel for FoodStore, providing business metrics, full user CRUD, specialized stock management, order management for admins, and user profile editing.

## 2. Proposed Solution
### Backend
1. **User Management (`/admin/usuarios`)**:
   - Implement `GET` with pagination to list users.
   - Implement `GET /{id}` for user details.
   - Implement `POST` to create users manually (hashing passwords).
   - Implement `PUT` to update user details.
   - Implement `DELETE` to perform a soft delete (set `deleted_at`).
2. **Metrics Module (`/admin/metricas`)**:
   - `GET /dashboard`: Aggregate totals (total orders, total revenue, orders today, top products).
   - `GET /ventas`: Time-series revenue data.
   - `GET /productos-top`: Best-selling products by quantity.
   - `GET /estados-pedidos`: Count of orders per status.
3. **Profile Module (`/perfil`)**:
   - `GET /`: Returns the current user's profile.
   - `PUT /`: Updates user details.
   - `POST /cambiar-contrasena`: Verifies current password and updates to a new one.
4. **Deleted Records (`/admin/registros-eliminados`)**:
   - Endpoint to query soft-deleted records across tables (users, products, categories).

### Frontend
1. **Admin Dashboard (`/admin/dashboard`)**:
   - Install `recharts`.
   - Build a dashboard with KPI cards and 3 charts (Sales LineChart, Top Products BarChart, Order Status PieChart).
2. **User Management (`/admin/usuarios`)**:
   - Build a paginated table for users.
   - Implement create/edit modals and role assignment (extending current functionality).
3. **Admin Orders (`/admin/pedidos`)**:
   - Build a table listing all orders in the system with filters by status.
   - Allow admins to change order statuses.
4. **Stock Management (`/admin/stock`)**:
   - Build a dedicated table for products showing only `nombre`, `stock_actual`, `stock_minimo`, and an inline or modal editor to quickly update stock.
5. **Profile Page (`/perfil`)**:
   - Build a form for users to edit their personal data and change their password.

## 3. Scope
- **In Scope**: All features listed in Epic 07 (User CRUD, Metrics, Stock Admin, Admin Orders, Profile).
- **Out of Scope**: Real-time WebSocket updates for the dashboard (polling will be used as per acceptance criteria).

## 4. Alternatives Considered
- **Metrics calculation**: We could have used PostgreSQL materialized views for metrics if performance was an issue. *Decision*: For the current scale, direct SQLAlchemy `func.sum`/`func.count` queries on the live tables are sufficient and simpler to maintain.
- **Frontend Charting**: Considered `Chart.js`. *Decision*: `recharts` is more aligned with React patterns and easier to integrate with our Tailwind setup.
