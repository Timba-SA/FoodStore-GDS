# Tareas: Fix Datetime Updates Error

## Fase de Implementación

- [x] **ProductoService**: Reemplazar `datetime.now(timezone.utc)` por `datetime.utcnow()` en los métodos de modificación.
- [x] **CategoriaService**: Reemplazar `datetime.now(timezone.utc)` por `datetime.utcnow()` en los métodos de modificación.
- [x] **IngredienteService**: Reemplazar `datetime.now(timezone.utc)` por `datetime.utcnow()` en los métodos de modificación.

## Fase de Verificación

- [x] Confirmar que no queden referencias a `datetime.now(timezone.utc)` que rompan las columnas timestamp without timezone en los módulos afectados.
- [x] Ejecutar peticiones POST/PUT desde el Frontend y confirmar respuesta exitosa (HTTP 20X) sin errores de `asyncpg`.
