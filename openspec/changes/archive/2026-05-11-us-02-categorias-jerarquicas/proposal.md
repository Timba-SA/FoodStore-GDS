# Change Proposal: Categorías Jerárquicas

## 1. Problem Statement
El sistema de catálogo actual contempla un modelo plano para `Categoria`. Sin embargo, los e-commerce modernos (y los requerimientos de la historia de usuario US-008) exigen la posibilidad de anidar categorías (ej. `Alimentos > Bebidas > Gaseosas`). Este anidamiento requiere evitar ciclos infinitos y proteger la integridad relacional de la base de datos (ej. soft deletes en caso de tener productos activos).

## 2. Proposed Solution
Se extenderá el modelo `Categoria` con un campo `parent_id` (foreign key a `Categoria.id`). Se expondrán endpoints de CRUD (Listar, Crear, Editar, Eliminar) bajo `api/v1/categorias`. 
Para evitar ciclos y recuperar el árbol de categorías eficientemente, se diseñará la consulta usando CTEs recursivos (Common Table Expressions) de PostgreSQL y validaciones preventivas a nivel de Service. Además, se implementará un componente visual en el frontend capaz de iterar y renderizar estructuras anidadas (árbol).

## 3. Scope and Capabilities

### In Scope
- **Backend:**
  - Migración de base de datos para agregar `parent_id` a la tabla `categorias`.
  - Crear endpoints CRUD en el router `categorias`.
  - Validaciones de negocio: prevención de ciclos (no poder ser padre de un descendiente ni de sí mismo).
  - Implementar Soft Delete (`deleted_at`) en `Categoria` en caso de que no tenga productos o hijos activos.
  - Generar un árbol serializado en la API.
- **Frontend:**
  - UI de CRUD de Categorías.
  - Árbol de navegación visual.
  - Protección de las rutas usando roles (STOCK, ADMIN).

### Out of Scope
- Gestión de productos (esto pertenece a `02-productos-catalogo`).
- Imágenes de categorías subidas al storage (solo trabajaremos con URLs de imagen de momento).

## 4. Technical Approach
- **Modelo:** Agregar `parent_id` opcional mapeado al ID de otra categoría.
- **Validación de Ciclos:** El algoritmo para validar inserciones/actualizaciones chequeará mediante un query si el nuevo `parent_id` pertenece a la rama de descendientes de la categoría actual.
- **Soft Deletes:** En `BaseModel` ya existe `deleted_at`. Implementaremos la restricción: no se puede hacer soft delete de una categoría si esta posee hijos activos o productos asociados activos.

## 5. Risk Assessment
- **Riesgo:** Consultas N+1 al tratar de armar la jerarquía de categorías en el backend.
  - **Mitigación:** Usar un query CTE con `WITH RECURSIVE` para buscar todas las categorías de una sola vez y armar el árbol en memoria en Python o directamente en la DB.
- **Riesgo:** Ciclos infinitos en Frontend que generen "stack overflow" visual.
  - **Mitigación:** Validaciones estrictas en Backend y detección recursiva segura en UI.
