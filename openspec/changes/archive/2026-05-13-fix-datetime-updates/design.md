# Diseño: Fix Datetime Updates Error

## Contexto Arquitectónico
La base de datos PostgreSQL del proyecto utiliza columnas del tipo `TIMESTAMP WITHOUT TIME ZONE` para manejar las fechas de auditoría y ciclo de vida de los registros (`created_at`, `updated_at`, `deleted_at`).
El driver asíncrono de PostgreSQL, `asyncpg`, requiere que los objetos `datetime` de Python pasados a estas columnas sean "naive" (es decir, que no contengan un objeto `tzinfo` asociado) para evitar discrepancias y conversiones silenciosas indeseadas.

## Solución Propuesta

### Problema Actual
Las funciones CRUD en los servicios del módulo de catálogo hacían uso de `datetime.now(timezone.utc)`:
```python
producto.updated_at = datetime.now(timezone.utc)
```
Esto creaba un objeto aware, lo cual provocaba un rechazo directo de `asyncpg` y resultaba en un `HTTP 500 Internal Server Error`.

### Implementación
Se realizará una búsqueda y reemplazo en las capas de servicios afectadas para estandarizar la generación de la fecha de auditoría:
```python
producto.updated_at = datetime.utcnow()
```

### Componentes Afectados
1. `backend/app/modules/productos/service.py`
   - `update`
   - `update_stock`
   - `soft_delete`
2. `backend/app/modules/categorias/service.py`
   - `update`
   - `soft_delete`
3. `backend/app/modules/ingredientes/service.py`
   - `update`
   - `soft_delete`

### Riesgos y Consideraciones
- **Mitigación**: `datetime.utcnow()` será eventualmente obsoleto en Python 3.12+, la alternativa correcta a futuro para naive UTC es `datetime.now(timezone.utc).replace(tzinfo=None)`. Dado el alcance acotado de este parche de urgencia, usaremos `utcnow()` que cumple con el estándar existente en el proyecto, pero se recomienda una refactorización global posterior para SQLAlchemy.
