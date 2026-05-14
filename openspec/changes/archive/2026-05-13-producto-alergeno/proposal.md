# Proposal: Añadir flag de alérgeno manual al producto

## Intent
Permitir a los administradores marcar explícitamente si un producto es un alérgeno (o contiene alérgenos) directamente desde la interfaz del producto, independientemente de los ingredientes asociados.

## Scope
- Base de datos (modelo `Producto`).
- Backend: Endpoint de creación, actualización y filtrado.
- Frontend: Formulario de creación/edición de productos.

## Approach
Añadir una columna booleana `es_alergeno` a la tabla `productos` con valor por defecto `False`. Modificar la lógica de negocio para que el filtro "sin alérgenos" oculte el producto tanto si la nueva columna es `True`, como si alguno de sus ingredientes es alérgeno. Actualizar el frontend para proveer el checkbox visual en el formulario de creación/edición.
