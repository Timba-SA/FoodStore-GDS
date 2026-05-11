# Archive Report: us-005-rbac-roles-permissions

## Executive Summary
The Role-Based Access Control (RBAC) system has been successfully implemented and integrated across both backend and frontend layers. This completes the implementation of task `us-005-rbac-roles-permissions`.

The architecture takes advantage of the auth flow completed in `us-002`, utilizing the JWT payload to store user roles, which allows for stateless and fast authorization checks. A scalable `require_role` dependency secures backend endpoints, while a flexible `ProtectedRoute` HOC manages view access on the frontend. A robust Admin service handles role assignments while preventing critical issues such as locking out the final admin.

## Accomplishments
- **Backend Authorization Middleware:**
  - Implemented the `require_role(allowed_roles: list[str])` factory in `backend/app/modules/auth/router.py`.
  - Enforces `403 Forbidden` standard responses when users lack required roles.
- **Admin Roles Management:**
  - Created endpoint `PUT /api/v1/admin/usuarios/{id}/roles` protected by `admin` role.
  - Implemented `AdminService.update_user_roles()` handling the insertion/removal of roles in the associative `UsuarioRol` table.
  - Implemented a "last admin" safeguard to prevent the sole admin from demoting themselves.
- **Frontend Protection & Routing:**
  - Designed and built the `ProtectedRoute` component to intercept routing and validate roles against the `authStore`.
  - Added `hasRole()` method to `authStore` to easily check permissions across components.
  - Ensured Axios interceptors accurately handle `403` status codes by clearing the session and redirecting the user to `/login`.

## Artifacts Updated/Created
- `backend/app/modules/auth/router.py`
- `backend/app/modules/admin/router.py`
- `backend/app/modules/admin/service.py`
- `frontend/src/features/auth/ProtectedRoute.tsx`
- `frontend/src/features/auth/store/authStore.ts`
- `frontend/src/shared/api/client.ts`
- `docs/CHANGES.md` (Checked off ACs)
- `openspec/changes/us-005-rbac-roles-permissions/tasks.md`

## State & Persistence
- The SDD DAG state for `us-005-rbac-roles-permissions` is officially marked as ARCHIVED.
