# Specification: Producto Alérgeno Manual

## Requirements
- `REQ-1`: La base de datos debe almacenar un flag booleano en la tabla `productos` indicando si el producto es un alérgeno de forma manual.
- `REQ-2`: La API debe permitir enviar el campo `es_alergeno` al crear o actualizar un producto.
- `REQ-3`: El listado de productos con el filtro `sin_alergenos=True` debe excluir aquellos que tengan el nuevo flag `es_alergeno` en `True`, y debe seguir excluyendo los que tengan ingredientes alérgenos.
- `REQ-4`: El formulario de "Nuevo producto" y "Editar producto" debe mostrar una casilla de verificación "Es alérgeno".

## Scenarios
- **Scenario 1**: Administrador crea producto con checkbox alérgeno marcado.
  - *Given* un administrador en el modal de Nuevo Producto.
  - *When* ingresa datos, marca "Es alérgeno" y guarda.
  - *Then* el producto se guarda en DB con `es_alergeno=True`.
- **Scenario 2**: Cliente busca productos sin alérgenos.
  - *Given* un producto marcado como alérgeno manualmente pero sin ingredientes alérgenos.
  - *When* se obtiene la lista de productos con `sin_alergenos=True`.
  - *Then* el producto marcado no aparece en la respuesta.
