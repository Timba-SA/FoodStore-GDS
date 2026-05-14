# Design: Producto Alérgeno Manual

## Architecture
- **DB Model:** Se añadirá `es_alergeno` (Boolean) al modelo `Producto` en SQLAlchemy/SQLModel.
- **Service Logic:** En `ProductoService.get_all`, el query de `sin_alergenos=True` cambiará de:
  ```python
  stmt = stmt.where(Producto.id.not_in(alergeno_subq))
  ```
  A una exclusión combinada:
  ```python
  stmt = stmt.where(
      Producto.id.not_in(alergeno_subq),
      Producto.es_alergeno.is_(False)
  )
  ```
- **Frontend Components:** `ProductoFormModal` se actualizará usando un nuevo estado en `useState` para gobernar el checkbox naranja que será idéntico en estilo al de los ingredientes.

## Trade-offs
Añadir la bandera manual introduce la posibilidad de que el estado "alérgeno" del producto se desincronice conceptualmente de sus ingredientes, pero satisface el requerimiento de negocio de poder forzar el estado.
