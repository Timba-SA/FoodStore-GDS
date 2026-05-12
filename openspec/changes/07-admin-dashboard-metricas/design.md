# Design: 07-admin-dashboard-metricas

## Architecture / Pattern
- Backend: Standard modular architecture (`app/modules/admin`, `app/modules/perfil`). The metrics will be placed inside `app/modules/admin/service_metricas.py` to keep things organized.
- Frontend: Feature-Sliced Design (FSD).
  - `src/features/admin/` for dashboard charts and metrics components.
  - `src/features/usuarios/` for user management forms and tables.
  - `src/features/perfil/` for profile management.

## API Contracts

### Admin Users (`/admin/usuarios`)
```typescript
GET /api/v1/admin/usuarios?skip=0&limit=50
Response: UserResponse[]

GET /api/v1/admin/usuarios/{id}
Response: UserResponse

POST /api/v1/admin/usuarios
Payload: { nombre, email, password, numero_telefono, roles_ids }
Response: UserResponse

PUT /api/v1/admin/usuarios/{id}
Payload: { nombre, email, numero_telefono }
Response: UserResponse

DELETE /api/v1/admin/usuarios/{id}
Response: { message: "Usuario eliminado" }
```

### Admin Metrics (`/admin/metricas`)
```typescript
GET /api/v1/admin/metricas/dashboard
Response: {
  total_pedidos: number,
  total_ingresos: number,
  pedidos_hoy: number,
  ingresos_hoy: number,
  top_producto: { nombre: string, cantidad: number } | null
}

GET /api/v1/admin/metricas/ventas?dias=7
Response: Array<{ fecha: string, ingresos: number }>

GET /api/v1/admin/metricas/productos-top?limit=5
Response: Array<{ nombre: string, cantidad: number }>

GET /api/v1/admin/metricas/estados-pedidos
Response: Array<{ estado: string, cantidad: number }>
```

### Profile (`/perfil`)
```typescript
GET /api/v1/perfil
Response: UserResponse

PUT /api/v1/perfil
Payload: { nombre, numero_telefono } // email might be restricted or allowed
Response: UserResponse

POST /api/v1/perfil/cambiar-contrasena
Payload: { password_actual, password_nueva }
Response: { message: "Contraseña actualizada" }
```

## Database Schema Changes
None required. `Usuario`, `Producto`, `Pedido`, and `DetallePedido` already have the necessary fields for these queries. `AuditMixin` provides `deleted_at`.

## Key Interactions
1. **Metrics Queries**:
   - Total revenue: `sum(Pago.monto)` where `Pago.estado == 'aprobado'`.
   - Top products: Join `DetallePedido` with `Producto`, group by `producto_id`, sum `cantidad`, order by sum descending.
   - Order statuses: Group `Pedido` by `estado_id`, count.
2. **User Soft Delete**:
   - Setting `deleted_at` on a User.
   - The auth system (login) must check `if user.deleted_at is not None` and deny access. We need to verify `get_user_by_email` or login logic handles this.
