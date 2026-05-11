# Implementation Tasks

## Phase 1: Database and Model Updates
- [x] 1.1 Modificar `app/db/models/categoria.py` para agregar `parent_id` y las relaciones `children`/`parent`.
- [x] 1.2 Ejecutar `alembic revision --autogenerate -m "Add parent_id to Categoria"` y aplicar la migración (`alembic upgrade head`).
- [x] 1.3 Modificar `schemas.py` de categorías para incluir `parent_id` (input) y listado anidado de `children` (output opcional).

## Phase 2: Service Layer & Business Logic
- [x] 2.1 Implementar `create_categoria` en el Service verificando validez.
- [x] 2.2 Implementar validación anti-ciclos en `update_categoria` (evitar auto-asignación o asignar descendientes como padres).
- [x] 2.3 Implementar soft delete validando que no tenga `children` ni productos activos.
- [x] 2.4 Extender `get_categorias` para opcionalmente devolver la estructura en formato árbol (Tree) o plano.

## Phase 3: Router Endpoints
- [x] 3.1 Exponer los métodos CRUD en el router de `categorias`.
- [x] 3.2 Proteger los endpoints de escritura (`POST`, `PUT`, `DELETE`) usando el middleware `require_role(["admin", "stock"])`.

## Phase 4: Frontend Implementation
- [x] 4.1 Definir interfaces de TS (`Categoria`, `CategoriaTree`) en el frontend y configurar peticiones a la API con Axios.
- [x] 4.2 Crear vista de tabla de administración de categorías mostrando jerarquía y badge de status.
- [x] 4.3 Crear/Actualizar el formulario (Modal/Page) para permitir la selección de `parent_id` al crear o editar, filtrando ramas inválidas.

## Phase 5: Testing
- [x] 5.1 Backend tests para la validación de ciclos (crear 3 niveles y fallar intentando que C sea padre de A).
- [x] 5.2 Backend tests para eliminación suave (fallar si hay descendientes, o setear `deleted_at`).
- [x] 5.3 Backend tests para validación de roles en endpoints de categorías.
