# Implementation Tasks: 03-direcciones-entrega

## Phase 1: Backend Schemas & Service
- [x] 1.1 Crear `app/modules/direcciones/schemas.py` (`DireccionCreate`, `DireccionUpdate`, `DireccionResponse`).
- [x] 1.2 Crear `app/modules/direcciones/service.py`. Implementar `get_by_usuario` y `get_by_id` (con filtro estricto de `usuario_id`).
- [x] 1.3 Implementar `create` en el service garantizando que si es la primera dirección, sea predeterminada.
- [x] 1.4 Implementar lógica atómica en `create`, `update` y `set_default` para asegurar que solo exista 1 dirección predeterminada por usuario.
- [x] 1.5 Implementar `delete` (hard delete dado que el modelo actual no soporta soft delete).

## Phase 2: Backend Router
- [x] 2.1 Crear `app/modules/direcciones/router.py`.
- [x] 2.2 Implementar endpoints CRUD (`GET /`, `POST /`, `PUT /{id}`, `DELETE /{id}`) protegidos con `get_current_user`.
- [x] 2.3 Implementar endpoint `PATCH /{id}/principal` para setear la dirección predeterminada.
- [x] 2.4 Registrar el router en `main.py` bajo el prefijo `/api/v1`.

## Phase 3: Frontend API & Hooks
- [x] 3.1 Crear `src/entities/direccion/types.ts` y `api.ts`.
- [x] 3.2 Crear `src/entities/direccion/hooks.ts` exponiendo las mutaciones y queries de TanStack Query.

## Phase 4: Frontend UI
- [x] 4.1 Crear componente `DireccionCard.tsx` (con acciones y badge de predeterminada).
- [x] 4.2 Crear componente `DireccionFormModal.tsx` con validaciones básicas de campos obligatorios.
- [x] 4.3 Crear página `MisDireccionesPage.tsx` para listar las direcciones.
- [x] 4.4 Registrar la ruta `/dashboard/direcciones` en `router.tsx` dentro de la zona protegida general (cliente logueado).

## Phase 5: Testing (Strict TDD)
- [x] 5.1 Escribir test: `test_create_first_address_is_default` (Verifica que la primera dirección creada se fuerza como predeterminada).
- [x] 5.2 Escribir test: `test_set_default_toggles_others` (Verifica que al setear predeterminada = True, las demás pasan a False).
- [x] 5.3 Escribir test: `test_enforce_ownership` (Verifica que buscar, actualizar o borrar con un usuario distinto lanza error).
