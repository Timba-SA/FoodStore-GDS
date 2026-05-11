# Proposal: 02-productos-catalogo

## Context
As part of the "ÉPICA 02 — Catálogo de Productos y Categorías" (US-015 to US-023), the application requires the main module: **Productos**. The product entity sits at the core of the e-commerce system. It must be manageable by admins/stock users (CRUD, stock, M2M relationships with categories and ingredients) and queryable by public users (available products only, filtering out allergens).

## Problem
Currently, the `Producto` model and its association tables (`ProductoCategoria`, `ProductoIngrediente`) exist in the database, but there is no business logic to manage them or expose them via the API. We need an efficient way to:
1. Handle full CRUD operations including atomic updates of M2M relations.
2. Provide a specialized endpoint or parameters to filter the public catalog (ensuring inactive or deleted products are hidden).
3. Allow safe stock modifications (US-021).
4. Implement a frontend interface for both administrators (management) and public users (shopping catalog with filters).

## Proposed Solution
We will implement the `productos` module in the backend using our established FSD/DDD-like pattern.
- **Backend**: We will create `schemas.py`, `service.py`, and `router.py`. The `ProductoService` will handle syncing M2M relations and filtering.
- **Frontend**: We will create `CatalogoPage` for the public, featuring a grid layout and a sidebar for filtering (categories, price range, allergens). We will also create an admin `ProductosPage` for inventory management.

## Trade-offs
- **M2M Synchronization**: For simplicity and reliability in updating categories and ingredients, we will use a "clear and replace" strategy during `PUT` requests rather than complex diffing logic, since the number of categories/ingredients per product is small.
- **Stock Management**: Stock will be updated via a dedicated endpoint (`PATCH /productos/{id}/stock`) to avoid race conditions and separate the concern from general product updates.
