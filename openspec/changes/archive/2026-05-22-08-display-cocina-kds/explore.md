# Exploration Report: Display de Cocina (KDS)
**Change ID**: `08-display-cocina-kds`
**Date**: 2026-05-21

## 1. Context & Overview
We explored the codebase to map out the implementation details for the KDS and the Cocinero role (`COCINA`).
The feature requires:
- Database seed adjustments (adding the `cocina` role, creating test user `cocina@foodstore.com`).
- Modifying `RolEnum` in the backend.
- Refining the backend FSM inside `PedidoService` to enforce restricted state transitions for `COCINA` (only `CONFIRMADO -> EN_PREPARACION` and `EN_PREPARACION -> EN_CAMINO`) and write audit history.
- Implementing a real-time event dispatcher (Server-Sent Events recommended for single-instance, or WebSockets) and corresponding API routers.
- Adapting the frontend FSD architecture (sidebar link, routing guards, auth store, custom resilient `/cocina` view with Web Audio API alerts and local timers).

## 2. Identified Files

### Existentes a Modificar
- **`backend/app/db/models/usuario.py`**:
  - Add `COCINA = "cocina"` to `RolEnum`.
- **`backend/app/db/seed.py`**:
  - Insert `Rol(codigo="cocina", nombre="Cocinero")` in seed data.
  - Create test user `cocina@foodstore.com` with password `password` and associate it to `cocina` role.
- **`backend/app/modules/pedidos/service.py`**:
  - Check in `avanzar_estado` that if current user role is `COCINA`, only transitions from `CONFIRMADO -> EN_PREP` and `EN_PREP -> EN_CAMINO` are allowed. Else, raise a 403 Forbidden.
  - Enforce audit logging with the chef's `usuario_id` into `HistorialEstadoPedido`.
- **`backend/app/main.py`**:
  - Register the new router `/api/v1/cocina`.
- **`frontend/src/shared/components/layout/navigation.ts`**:
  - Add "Pantalla Cocina" menu item visible for `admin`, `pedidos`, `cocina` roles.
- **`frontend/src/app/routes/router.tsx`**:
  - Register `/cocina` route pointing to `CocinaPage` wrapped inside `ProtectedRoute` with `allowedRoles={['admin', 'pedidos', 'cocina']}`.

### Nuevos a Crear
- **`backend/app/modules/cocina/router.py`**:
  - REST endpoints and WebSocket/SSE endpoints for real-time kitchen orders feed.
  - Endpoint `PATCH /api/v1/cocina/productos/{id}/disponibilidad` to toggling products availability.
- **`backend/app/modules/cocina/service.py`**:
  - In-process connection/event broadcast manager (`ConnectionManager`) to dispatch events to connected clients.
- **`frontend/src/pages/CocinaPage.tsx`**:
  - Real-time KDS view showing two-column layouts. Handles connection state, local wait timers, auto-polling fallback on disconnect, and audio warning signals.
- **`frontend/src/features/cocina/...`**:
  - React API hooks, axios calls, layout cards (`KdsCard`) separating code structure strictly following Feature-Sliced Design.

---
*Persisted under openspec artifact store.*
