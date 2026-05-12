# SDD Design: 04-carrito-cliente

## 1. Frontend Architecture

### 1.1 State Management (`frontend/src/entities/cart/store.ts`)
We will use Zustand with the `persist` middleware to save the cart state in `localStorage`.

**Types**:
```typescript
import { ProductoResponse } from '@/entities/producto/types';

export interface CartItem {
  id: string; // Unique composite ID: `${productoId}-${hash(personalizacion)}`
  productoId: number;
  producto: ProductoResponse; // Snapshot
  cantidad: number;
  personalizacion: number[]; // IDs of excluded ingredients (INTEGER[])
}

export interface CartState {
  items: CartItem[];
  addItem: (producto: ProductoResponse, cantidad: number, personalizacion: number[]) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, cantidad: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
}
```

**Implementation details**:
- `addItem`: 
  1. Validates `personalizacion` against `producto.ingredientes`. Excluded IDs must exist in the product's ingredient list (RN-CR04).
  2. Generates the composite `id`. We can simply use `${producto.id}-${personalizacion.slice().sort().join(',')}`.
  3. If `id` exists in `items`, increments `cantidad` (RN-CR03).
  4. If not, pushes a new `CartItem`.
- **Persistence**: Using `persist` from `zustand/middleware`, naming the storage key `foodstore-cart`. We only need to persist the `items` array.

### 1.2 UI Components

#### `src/features/cart/CartDrawer.tsx`
A sliding drawer accessible globally.
- Maps over `items` to render `CartItemCard` components.
- Shows the calculated total price (`getSubtotal()`).
- Shows "Proceder al pago" (Checkout placeholder) and "Vaciar carrito" buttons.
- Empty state: "Tu carrito está vacío".

#### `src/features/cart/CartItemCard.tsx`
- Displays `producto.nombre`, `producto.precio`, and a thumbnail if available.
- Displays exclusions clearly: e.g., "Sin: Cebolla, Tomate" by looking up the names from the `producto.ingredientes` array using the IDs in `personalizacion`.
- Controls: `-` / `+` buttons to update quantity, and a trash button to remove the item.

#### `src/features/productos/ProductoDetailModal.tsx`
A modal opened from the `CatalogoPage` when clicking "Agregar al carrito".
- Displays full product information.
- Renders a list of checkboxes for the product's `ingredientes`. The user checks the ones they want to EXCLUDE.
- Quantity selector.
- "Agregar a mi pedido" button that triggers `cartStore.addItem()`.

### 1.3 Integration
- **Navbar**: Add a Cart Icon (e.g., using a Lucide-react icon or a simple SVG) with a badge showing `getTotalItems()`. Clicking it opens the `CartDrawer`.
- **CatalogoPage**: Connect the "Agregar" button on `ProductoCard` to open the `ProductoDetailModal`.

## 2. Dependencies
- `zustand` (already installed and configured in `00-zustand-stores-setup`).
- `@tanstack/react-query` (existing, used for catalog fetching).

## 3. Testing Strategy
- The logic is 100% client-side. We will verify manually during the implementation phase that:
  - Persistence survives reload and logout.
  - Adding the same product with the same exclusions increments quantity.
  - Adding the same product with different exclusions creates a new cart line.
  - Exclusions only allow valid ingredient IDs from the product.
