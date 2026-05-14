# Fix Datetime Updates Error

## Goal
Fix `500 Internal Server Error` during updates and soft deletes of Productos, Categorias, and Ingredientes.

## Context
When attempting to update a product, the backend raises a `500 Internal Server Error`. Upon investigation, the issue is identical to the one previously fixed in the authentication module: `asyncpg` rejects timezone-aware datetimes (`datetime.now(timezone.utc)`) when saving to PostgreSQL columns configured as `TIMESTAMP WITHOUT TIME ZONE`.

## Scope
- `ProductoService` (update, update_stock, soft_delete)
- `CategoriaService` (update, soft_delete)
- `IngredienteService` (update, soft_delete)

## Approach
Replace all instances of `datetime.now(timezone.utc)` with `datetime.utcnow()` in the affected service files. This matches the established pattern in `BaseModel` and `AuthService` to keep naive UTC datetimes compatible with the current DB schema.
