# Implementation Tasks

## Phase 1: Backend Schemas & Service
- [x] 1.1 Crear `app/modules/productos/schemas.py` (`ProductoCreate`, `ProductoUpdate`, `ProductoStockUpdate`, `ProductoResponse`).
- [x] 1.2 Crear `app/modules/productos/service.py`. Implementar carga de relaciones M2M (`selectinload`).
- [x] 1.3 Implementar `create` y `update` manejando la inserción/sincronización en `productos_categorias` y `productos_ingredientes`.
- [x] 1.4 Implementar `get_all` con soporte para filtros (`search`, `categoria_id`, `min_price`, `max_price`, `sin_alergenos`, `include_inactive`).
- [x] 1.5 Implementar `update_stock` para ajustar inventario y `soft_delete`.

## Phase 2: Backend Router
- [x] 2.1 Crear `app/modules/productos/router.py`.
- [x] 2.2 Exponer `GET /` y `GET /{id}`. Catálogo público solo muestra activos.
- [x] 2.3 Exponer `POST /`, `PUT /{id}`, `PATCH /{id}/stock`, `DELETE /{id}` protegidos por `["admin", "stock"]`.
- [x] 2.4 Registrar el router en `main.py`.

## Phase 3: Frontend API & Hooks
- [x] 3.1 Crear `src/entities/producto/types.ts` y `api.ts`.
- [x] 3.2 Crear `src/entities/producto/hooks.ts` con React Query.

## Phase 4: Frontend UI (Admin & Public)
- [x] 4.1 Crear componente `ProductoCard` y `ProductoFormModal` (con selectores múltiples para categorías e ingredientes).
- [x] 4.2 Crear `src/pages/AdminProductosPage.tsx` para la gestión administrativa del catálogo.
- [x] 4.3 Crear `src/pages/CatalogoPage.tsx` con sidebar de filtros y grid de productos.
- [x] 4.4 Registrar las rutas en `router.tsx` (`/catalogo` público, `/admin/productos` protegido).

## Phase 5: Testing
- [x] 5.1 Escribir tests para validación de precio y stock (>=0).
- [x] 5.2 Escribir tests para el control de stock (operaciones `add`, `subtract`, `set`).
- [x] 5.3 Escribir tests para los filtros de `get_all` (search, sin_alergenos).
