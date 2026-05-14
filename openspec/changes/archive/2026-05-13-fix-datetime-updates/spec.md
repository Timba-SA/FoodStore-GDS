# Especificación: Fix Datetime Updates Error

## Requerimientos Funcionales
- **RF1**: La actualización y el borrado lógico (soft delete) de productos, categorías e ingredientes debe persistirse exitosamente en la base de datos sin lanzar errores HTTP 500.

## Requerimientos Técnicos
- **RT1**: Los servicios de catálogo (`ProductoService`, `CategoriaService`, `IngredienteService`) deben usar exclusivamente objetos `datetime` de tipo naive (sin timezone) al asignar valores a las columnas `updated_at` y `deleted_at`.
- **RT2**: El valor de la fecha y hora debe corresponder a UTC, generado a través de `datetime.utcnow()`.

## Escenarios de Aceptación

### Escenario 1: Actualización de un Producto
- **Dado** que un usuario administrador está en el panel de productos
- **Cuando** modifica un atributo del producto (ej: la categoría o el precio) y guarda los cambios
- **Entonces** el sistema debe retornar un HTTP 200/201 con los datos actualizados
- **Y** el campo `updated_at` debe reflejar la fecha y hora exacta en formato UTC naive en la base de datos.

### Escenario 2: Borrado Suave de Categoría
- **Dado** una categoría existente sin productos vinculados
- **Cuando** un administrador elimina la categoría
- **Entonces** el sistema marca la categoría como eliminada internamente actualizando el campo `deleted_at` usando un datetime naive
- **Y** la operación se completa exitosamente sin errores 500.
