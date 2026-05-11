# Design: 02-productos-catalogo

## Architecture
The feature is vertically sliced.
- **Backend Module**: `app/modules/productos/`
- **Frontend Entities**: `src/entities/producto/`
- **Frontend Features**: `src/features/productos/`
- **Frontend Pages**: `src/pages/admin/ProductosPage.tsx`, `src/pages/public/CatalogoPage.tsx`

## API Design

### Endpoints
- `GET /api/v1/productos`: Retrieves list of products.
  - Query params: `search` (str), `categoria_id` (int), `min_price` (decimal), `max_price` (decimal), `sin_alergenos` (bool), `include_inactive` (bool, requires ADMIN/STOCK).
- `GET /api/v1/productos/{id}`: Detailed product info including nested lists of its categories and ingredients.
- `POST /api/v1/productos`: Creates a product + its associations (ADMIN/STOCK).
- `PUT /api/v1/productos/{id}`: Updates a product + its associations (ADMIN/STOCK).
- `PATCH /api/v1/productos/{id}/stock`: Updates stock delta or absolute value (ADMIN/STOCK).
- `DELETE /api/v1/productos/{id}`: Soft deletes the product (ADMIN/STOCK).

### Schemas (`app/modules/productos/schemas.py`)
- `ProductoCreate`: Includes `categoria_ids: list[int]` and `ingrediente_ids: list[int]`.
- `ProductoUpdate`: Optional fields, including updated ID lists.
- `ProductoStockUpdate`: `cantidad: int`, `operacion: Literal['add', 'set', 'subtract']`.
- `ProductoResponse`: Base data + list of `CategoriaResponse` and `IngredienteResponse`.

## Database Interactions (`ProductoService`)
- We will leverage `selectinload` for `productos_categorias.categoria` and `productos_ingredientes.ingrediente` to efficiently fetch the graph.
- Associations will be written by deleting existing records in the M2M table for the product and inserting new ones based on the provided IDs.

## Frontend UI Components
1. **`CatalogoPage`**: Public layout. Features a left-hand filter sidebar and a responsive grid of `ProductoCard` components.
2. **`ProductoCard`**: Displays image (or placeholder), name, price, stock status (In stock / Out of stock), and an "Add to Cart" button (mocked for now).
3. **`AdminProductosPage`**: Data table with columns: SKU, Name, Price, Stock, Status. Actions: Edit, Delete, Adjust Stock.
4. **`ProductoFormModal`**: Multi-select fields for Categories and Ingredients.

## Security & Validation
- Prices must be >= 0.
- Stock must be >= 0.
- `include_inactive` query parameter ignores the soft-delete filter but is only allowed for users with ADMIN or STOCK roles. Public users only ever see `activo=True` and `deleted_at IS NULL`.
