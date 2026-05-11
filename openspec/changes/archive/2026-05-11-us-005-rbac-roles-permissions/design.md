# Technical Design: RBAC (Role-Based Access Control)

## 1. Architectural Approach
El sistema de autorización se basa en el patrón RBAC estándar, utilizando los claims del JSON Web Token (JWT) emitido durante el login para evitar consultas a la base de datos en cada request.

*   **FastAPI**: Se implementará un Factory de dependencias `require_role(allowed_roles: list[str])`. Este verificará la intersección entre los roles requeridos y los roles presentes en el claim `roles` del JWT del usuario.
*   **React (Frontend)**: Se implementará un `ProtectedRoute` (High Order Component o Wrapper) que evalúe si el `user.roles` en el `authStore` coincide con los roles requeridos de la vista.

## 2. Models / Schema Changes
No hay cambios en la base de datos. Se asume la existencia de:
*   `Rol`: `id`, `nombre`
*   `UsuarioRol`: `usuario_id`, `rol_id` (tabla intermedia)
*   Seed script: Ya debe insertar los roles `ADMIN (1)`, `STOCK (2)`, `PEDIDOS (3)`, `CLIENT (4)`.

El claim JWT se asume de la forma:
```json
{
  "sub": "1",
  "email": "admin@foodstore.com",
  "roles": ["ADMIN"]
}
```

## 3. API Contract Changes

### `PUT /api/v1/admin/usuarios/{id}/roles`
- **Auth:** Requiere JWT y rol `ADMIN`.
- **Request Body:**
  ```json
  {
    "roles_ids": [1, 2]
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "id": 1,
    "email": "user@example.com",
    "roles": [{"id": 1, "nombre": "ADMIN"}, {"id": 2, "nombre": "STOCK"}]
  }
  ```
- **Errors:**
  - `403 Forbidden`: Si el usuario autenticado no es `ADMIN`.
  - `400 Bad Request`: Si el admin intenta quitarse el rol ADMIN a sí mismo y es el único admin activo en el sistema.

## 4. UI / UX Design
- **ProtectedRoute**: Un componente genérico que envuelve las páginas en `react-router-dom`. Si el usuario no está logueado, redirige a `/login`. Si está logueado pero no tiene el rol, redirige a una página `403 No Autorizado` o a la raíz `/` con un Toast de error.
- **Zustand `authStore`**: Debe incluir el método `hasRole(role: string): boolean`.

## 5. Security & Edge Cases
- **Self-Demotion (Quitarse permisos)**: Un ADMIN puede editarse a sí mismo, pero no puede vaciar su lista de roles excluyendo "ADMIN" si un `COUNT` a la DB indica que él es el último usuario con el rol ADMIN.
- **JWT Stale Data**: Si un ADMIN le revoca un permiso a un STOCK, el JWT de STOCK seguirá siendo válido hasta que expire. Para escenarios muy estrictos, se podría obligar a un refresh, pero en esta etapa confiaremos en la expiración corta del access token (30 min) y que en la próxima rotación recibirá los roles actualizados.
