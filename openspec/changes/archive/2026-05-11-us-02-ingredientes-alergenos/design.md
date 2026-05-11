# Technical Design: Ingredientes y Alérgenos

## 1. Architectural Approach
Continuamos usando el patrón Router -> Service -> Repository/Model en FastAPI, y React + TanStack Query en Frontend, manteniendo consistencia total con el módulo de Categorías.

## 2. Models / Schema Changes
El modelo `Ingrediente` en `app/db/models/producto.py` será modificado:
- `es_alergeno`: `bool = Field(default=False, description="Indica si el ingrediente es un alérgeno conocido")`

Se generará migración con Alembic: `alembic revision --autogenerate -m "Add es_alergeno to Ingrediente"`.

## 3. API Contract Changes

### `GET /api/v1/ingredientes`
- Soporta Query Params:
  - `include_inactive` (bool, default False)
  - `solo_alergenos` (bool, default False)
  - `search` (str, opcional) para buscar por nombre.
- Retorna lista de ingredientes.

### `POST /api/v1/ingredientes`
- Requiere roles: `["admin", "stock"]`.
- Body: `nombre` (str), `descripcion` (str?), `es_alergeno` (bool).
- Validaciones: `nombre` debe ser único globalmente.

### `PUT /api/v1/ingredientes/{id}`
- Requiere roles: `["admin", "stock"]`.
- Actualización parcial de campos.

### `DELETE /api/v1/ingredientes/{id}`
- Requiere roles: `["admin", "stock"]`.
- Realiza Soft Delete (`deleted_at`). Falla si el ingrediente tiene registros en `ProductoIngrediente` asociados a productos que no estén borrados lógicamente.

## 4. Frontend UI / UX Design
- **Ruta:** `/admin/ingredientes` (protegida).
- **Page (`IngredientesPage.tsx`):**
  - Barra superior con título y botón "+ Nuevo ingrediente".
  - Filtros: Input de búsqueda de texto, Checkbox "Mostrar inactivos", Checkbox "Solo alérgenos".
  - Tabla con columnas: Nombre, Descripción, Alérgeno (Badge rojo si aplica), Estado, Acciones (Editar/Eliminar).
- **Modal (`IngredienteForm.tsx`):**
  - Inputs: Nombre (text), Descripción (textarea), Es Alérgeno (checkbox o toggle).
  - Manejo de estados de carga y error.
