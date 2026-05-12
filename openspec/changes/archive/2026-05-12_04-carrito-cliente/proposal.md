# SDD Proposal: 04-carrito-cliente

## 1. Context
The user has requested the implementation of Epic 04: Client-side Shopping Cart (`04-carrito-cliente`). This module handles the cart logic entirely in the browser using React state management (`Zustand`), with persistence across sessions via `localStorage`. The cart supports product customization (specifically, excluding ingredients like allergens).

## 2. Proposed Architecture

### 2.1 State Management (Zustand)
We will create a dedicated store: `useCartStore` in `src/entities/cart/store.ts`.

- **State Interface**:
  - `items`: An array of `CartItem`.
  - A `CartItem` will contain exactly the fields requested in `CHANGES.md`:
    - `id`: A composite unique ID for the cart line (`productoId-hash(personalizacion)`).
    - `productoId`: Number.
    - `producto`: Snapshot of the `ProductoResponse`.
    - `cantidad`: Number.
    - `personalizacion`: Array of ingredient IDs to exclude (`number[]`).
- **Actions**:
  - `addItem(producto, cantidad, personalizacion)`: Adds an item. If an item with the exact same `productoId` and `personalizacion` already exists, it increments the `cantidad` (satisfying RN-CR03: "Duplicado -> incremente qty").
  - `removeItem(cartItemId)`: Removes an item by its composite ID.
  - `updateQuantity(cartItemId, cantidad)`: Updates the quantity.
  - `clearCart()`: Resets the cart to an empty array.
- **Computed**:
  - `subtotal`: `cantidad * producto.precio`.
  - `total`: sum of all item subtotals.
- **Persistence**:
  - We will use Zustand's `persist` middleware with `localStorage` (key: `foodstore-cart`). This satisfies RN-CR02.

### 2.2 UI Components
- **Cart Drawer**: A sliding drawer accessible globally (e.g., clicking a cart icon in the Navbar) to view and manage the cart.
- **Product Details Modal**: The `CatalogoPage` will open a modal to allow selecting "ingredientes a excluir" before adding to the cart. It will validate that only ingredients the product actually has can be excluded (RN-CR04).

## 3. Trade-offs and Considerations
- **Cart Item Uniqueness**: To support having the same product with different customizations (e.g., one burger with tomato, one without), we must use a composite `id` for the cart line, while keeping the `productoId` field as requested by the spec.
- **Price changes**: Since we store a snapshot of the product in `localStorage`, if the backend price changes, the cart holds the price at the time of addition. This is standard client-side cart behavior.

## 4. Next Steps
Generate the `design.md` and `tasks.md` specs.
