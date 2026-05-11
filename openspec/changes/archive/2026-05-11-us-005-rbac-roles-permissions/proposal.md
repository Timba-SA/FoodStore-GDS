# Change Proposal: RBAC (Role-Based Access Control)

## 1. Problem Statement
El sistema actualmente cuenta con autenticación y generación de JWTs, pero carece de un modelo de autorización. Es necesario implementar un sistema de Control de Acceso Basado en Roles (RBAC) para proteger los endpoints del backend y las rutas del frontend, asegurando que cada tipo de usuario (ADMIN, STOCK, PEDIDOS, CLIENT) solo pueda acceder a los recursos que le corresponden.

## 2. Proposed Solution
Se propone implementar un modelo RBAC con 4 roles base (ADMIN, STOCK, PEDIDOS, CLIENT). En el backend, se creará un middleware o dependencia (`require_role()`) en FastAPI para verificar roles a partir de los claims del JWT. Se incluirá un endpoint exclusivo para ADMIN que permita asignar y revocar roles de otros usuarios. En el frontend, se implementará un componente `ProtectedRoute` para envolver rutas y un esquema condicional en la UI (Navbar/Sidebar) según el rol del usuario, así como manejadores globales para errores 401 (Refresh + Retry) y 403 (Acceso Denegado).

## 3. Scope and Capabilities

### In Scope
- **Backend**:
  - Implementación de la dependencia `require_role([roles])`.
  - Inclusión de roles en el payload del JWT emitido durante el login.
  - Endpoint `PUT /api/v1/admin/usuarios/{id}/roles` para asignar roles (solo accesible por ADMIN).
  - Validaciones de negocio: un ADMIN no puede quitarse el rol ADMIN si es el último que le queda.
- **Frontend**:
  - Componente HOC `ProtectedRoute` para control de acceso a vistas.
  - Manejo global de HTTP 403 y 401 mediante axios interceptors.
  - UI de asignación de roles (para rol ADMIN).
  - Renderizado condicional de elementos de UI (Navbar/Sidebar) según roles (será una base para `07-navegacion-layout-base`).

### Out of Scope
- Gestión granular de permisos a nivel de recurso individual (ABAC o ACL).
- Vistas completas del dashboard de administración (eso se abordará en `07-admin-dashboard-metricas` y `07-navegacion-layout-base`).

## 4. Technical Approach

### Architecture & Patterns
- Se utilizará la tabla pivote existente `usuario_rol` para mapear usuarios con sus respectivos roles.
- **FastAPI Dependency Injection**: La función `get_current_user` ya valida el JWT. Se construirá `require_role(allowed_roles: list[str])` que consuma `get_current_user` y verifique contra el JWT o la base de datos si el usuario cuenta con los permisos necesarios.
- **Zustand Auth Store**: El frontend mantendrá los claims del usuario y sus roles en `authStore` para evitar decodificar el token múltiples veces por vista.

### Data Model Impacts
- Las tablas `Rol` y `UsuarioRol` ya deberían haber sido creadas mediante `00-postgres-migrations-seed`. No se espera requerir nuevas migraciones, pero se asume su uso intensivo.

## 5. Risk Assessment
- **Riesgo:** Bloqueo accidental de administradores (Lockout).
  - **Mitigación:** Validar explícitamente en el backend que al actualizar roles de un usuario, si es el usuario autenticado que está haciendo la solicitud y se está quitando el rol de ADMIN, la operación sea rechazada si es el único ADMIN del sistema.
- **Riesgo:** Inconsistencia entre frontend y backend si los tokens de frontend tienen roles desactualizados tras un cambio por parte de un ADMIN.
  - **Mitigación:** Al recibir un error 403 del backend, el interceptor podría forzar un refresco del estado del usuario o pedir relogin.

## 6. Testing Strategy
- Tests unitarios en el backend para la dependencia `require_role()` (simulando tokens con distintos roles).
- Tests de integración para `PUT /api/v1/admin/usuarios/{id}/roles` validando los casos de uso exitosos, 403 (no admin) y fallos (quitar último admin).
- Verificación manual del frontend confirmando redirecciones y visibilidad de rutas de acuerdo al rol autenticado.
