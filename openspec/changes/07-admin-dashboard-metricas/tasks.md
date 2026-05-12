# Implementation Tasks: 07-admin-dashboard-metricas

## Phase 1: Backend - Admin User Management
- [x] 1.1 Update `Usuario` model and Auth logic to ensure soft-deleted users (`deleted_at != None`) cannot log in.
- [x] 1.2 Create `UsuarioCreate` and `UsuarioUpdate` schemas in `app/modules/admin/schemas.py`.
- [x] 1.3 Add CRUD methods (list, get, create, update, soft_delete) to `AdminService` (`app/modules/admin/service.py`). Creates/hashes password using `AuthService.hash_password`.
- [x] 1.4 Add endpoints `GET /usuarios`, `GET /usuarios/{id}`, `POST /usuarios`, `PUT /usuarios/{id}`, `DELETE /usuarios/{id}` to `app/modules/admin/router.py`.

## Phase 2: Backend - Metrics & Profile
- [x] 2.1 Create schemas for metrics responses in `app/modules/admin/schemas.py`.
- [x] 2.2 Create `MetricsService` in `app/modules/admin/service_metricas.py` with methods for dashboard KPIs, sales chart, top products, and status distribution.
- [x] 2.3 Add `GET /metricas/*` endpoints to `app/modules/admin/router.py`.
- [x] 2.4 Create `app/modules/perfil/` module (router, schemas, service) for `GET /`, `PUT /`, and `POST /cambiar-contrasena`. Registered in `main.py`.
- [x] 2.5 Create endpoint `GET /admin/registros-eliminados` to list soft-deleted records.

## Phase 3: Frontend - SDK & Dependencies
- [x] 3.1 Run `npm install recharts --legacy-peer-deps`.
- [x] 3.2 Create TanStack Query API and hooks for `admin/usuarios`.
- [x] 3.3 Create TanStack Query API and hooks for `admin/metricas`.
- [x] 3.4 Create TanStack Query API and hooks for `perfil` (inline in PerfilPage using axios client).

## Phase 4: Frontend - Admin UI (Dashboard & Users)
- [x] 4.1 Create `AdminDashboardPage.tsx` using `recharts` for charts and KPI cards. Added to router.
- [x] 4.2 Create `AdminUsuariosPage.tsx` with a data table for users. Added to router.
- [x] 4.3 Create `UserFormModal` (inline in `AdminUsuariosPage.tsx`) for creating/editing users. Roles managed via inline toggle buttons.
- [x] 4.4 Routes registered in `router.tsx` with `ProtectedRoute allowedRoles={['admin']}`.

## Phase 5: Frontend - Profile, Stock & Orders
- [x] 5.1 Create `PerfilPage.tsx` for updating user details and password. Added to router.
- [x] 5.2 Create `AdminStockPage.tsx` for fast stock editing (table of products with inline stock input). Added to router.
- [x] 5.3 Create `AdminPedidosPage.tsx` listing all orders with the ability to change their status. Added to router.

## Phase 6: Testing & Validation
- [ ] 6.1 Backend: Test login fails for soft-deleted users.
- [ ] 6.2 Backend: Verify metric aggregations return correct numbers.
- [ ] 6.3 Frontend: Verify charts render correctly without data errors.
- [ ] 6.4 E2E: Admin creates user, edits role, deletes user. User edits profile.
