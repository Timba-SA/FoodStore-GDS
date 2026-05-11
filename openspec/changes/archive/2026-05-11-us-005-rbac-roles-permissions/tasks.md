# Implementation Tasks

## Phase 1: Backend Auth Updates
- [x] 1.1 Modificar el endpoint de login y refresh para incluir la lista de roles del usuario en el payload del JWT y en el objeto de respuesta del usuario.
- [x] 1.2 Actualizar schemas Pydantic de Auth para reflejar la presencia de roles.

## Phase 2: Backend Authorization Middleware
- [x] 2.1 Implementar la función factory `require_role(allowed_roles: list[str])` en `backend/app/core/security.py` o en un módulo de dependencias (`deps.py`).
- [x] 2.2 Agregar manejo de excepciones que arroje `HTTPException(403, detail="Not enough permissions")` si el rol no coincide.

## Phase 3: Backend Admin Roles Management
- [x] 3.1 Crear el endpoint `PUT /api/v1/admin/usuarios/{id}/roles` en un nuevo router o en el de usuarios.
- [x] 3.2 Implementar en el CRUD o Service la lógica de asignación/revocación en la tabla intermedia `UsuarioRol`.
- [x] 3.3 Implementar validación "último admin": hacer COUNT de usuarios con el rol ADMIN antes de permitir que un ADMIN se lo quite a sí mismo.

## Phase 4: Frontend Auth & Routing
- [x] 4.1 Actualizar el tipado de `authStore` y `Usuario` en frontend para incluir el campo `roles`.
- [x] 4.2 Agregar método `hasRole(allowedRoles: string[])` al `authStore` o como utilitario.
- [x] 4.3 Crear el componente `ProtectedRoute` que valide roles y reaccione en base al contexto del router.
- [x] 4.4 Agregar manejo explícito de 403 en los interceptors de Axios para desloguear o redirigir en caso de desincronización crítica de JWT.

## Phase 5: Testing
- [x] 5.1 Escribir tests unitarios/integración en el backend para probar la dependencia `require_role`.
- [x] 5.2 Escribir tests para el endpoint de asignación de roles y la restricción del último ADMIN.

