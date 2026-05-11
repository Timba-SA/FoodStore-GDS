# Implementation Tasks

## Phase 1: Database and Model Updates
- [x] 1.1 Modificar `app/db/models/producto.py` para agregar `es_alergeno` (bool, default False) a la clase `Ingrediente`.
- [x] 1.2 Ejecutar `alembic revision --autogenerate -m "Add es_alergeno to Ingrediente"` y aplicar la migración (`alembic upgrade head`).

## Phase 2: Service Layer & Business Logic
- [x] 2.1 Crear `app/modules/ingredientes/schemas.py` con `IngredienteCreate`, `IngredienteUpdate`, `IngredienteResponse`.
- [x] 2.2 Crear `app/modules/ingredientes/service.py` con `IngredienteService`.
- [x] 2.3 Implementar validación de nombre único en `create` y `update`.
- [x] 2.4 Implementar filtrado por `es_alergeno`, `include_inactive` y `search` en `get_all`.
- [x] 2.5 Implementar `soft_delete` verificando relaciones activas en `productos_ingredientes`.

## Phase 3: Router Endpoints
- [x] 3.1 Crear `app/modules/ingredientes/router.py` con endpoints CRUD.
- [x] 3.2 Proteger endpoints mutables (`POST`, `PUT`, `DELETE`) con `require_role(["admin", "stock"])`.
- [x] 3.3 Registrar el router en `app/main.py`.

## Phase 4: Frontend Implementation
- [x] 4.1 Crear `entities/ingrediente/types.ts` y `api.ts`.
- [x] 4.2 Crear `entities/ingrediente/hooks.ts` para TanStack Query.
- [x] 4.3 Implementar `features/ingredientes/IngredienteForm.tsx`.
- [x] 4.4 Implementar `pages/IngredientesPage.tsx` con filtros visuales, tabla, badge de alérgeno y modal de delete.
- [x] 4.5 Registrar ruta `/admin/ingredientes` en `router.tsx` protegida por `['admin', 'stock']`.

## Phase 5: Testing
- [x] 5.1 Backend tests para `IngredienteService`: creación, nombre duplicado.
- [x] 5.2 Backend tests para `soft_delete` de ingrediente.
- [x] 5.3 Backend tests para filtrado en `get_all` (search string, alergenos).
