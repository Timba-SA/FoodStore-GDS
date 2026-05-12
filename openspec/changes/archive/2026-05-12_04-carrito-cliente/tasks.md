# Implementation Tasks: 04-carrito-cliente

## Phase 1: Zustand Cart Store
- [x] 1.1 Crear `src/entities/cart/types.ts` con interfaces `CartItem` y `CartState`.
- [x] 1.2 Crear `src/entities/cart/store.ts` usando Zustand y `persist` middleware (storage key: `foodstore-cart`).
- [x] 1.3 Implementar lógica `addItem`: validar ingredientes a excluir (deben existir en el producto), generar ID compuesto (`productoId-personalizacion_ordenada`), e incrementar cantidad si el ID ya existe.
- [x] 1.4 Implementar acciones: `removeItem`, `updateQuantity` (asegurar mínimo 1), `clearCart`.
- [x] 1.5 Implementar selectores derivados (o métodos en el store) para `getSubtotal` y `getTotalItems`.

## Phase 2: Cart UI Components
- [x] 2.1 Crear `src/features/cart/CartItemCard.tsx`: renderizar información del producto, mostrar nombres de ingredientes excluidos, y controles de cantidad/eliminar.
- [x] 2.2 Crear `src/features/cart/CartDrawer.tsx`: componente contenedor lateral que mapea el carrito, muestra el subtotal y botones de acción (proceder al pago, limpiar carrito).

## Phase 3: Product Customization UI
- [x] 3.1 Crear `src/features/productos/ProductoDetailModal.tsx`: modal para visualizar el producto en detalle.
- [x] 3.2 Agregar listado de ingredientes con checkboxes para "Excluir" (generar array de IDs).
- [x] 3.3 Integrar el modal con `cartStore.addItem`.
- [x] 3.4 Modificar `ProductoCard` en `CatalogoPage` para que el botón "Agregar" abra el `ProductoDetailModal`.

## Phase 4: Integration & Validation
- [x] 4.1 Modificar el layout global o Navbar para incluir el botón/icono del carrito con el badge de `totalItems`.
- [x] 4.2 Conectar el botón del Navbar para abrir el `CartDrawer`.
- [x] 4.3 Validar persistencia: agregar items, recargar página, y confirmar que se mantienen.
- [x] 4.4 Validar duplicados y personalización: probar agregar mismo producto con y sin personalizaciones para asegurar que se separan correctamente en el carrito.
