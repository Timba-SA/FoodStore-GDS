# Change Proposal: Ingredientes y Alérgenos

## 1. Problem Statement
El sistema Food Store requiere la gestión de ingredientes para asociarlos a los productos. Es crítico para el negocio y para la salud de los clientes identificar claramente si un ingrediente es un alérgeno (ej: Maní, Gluten, Lácteos). Las historias de usuario US-011 a US-014 solicitan implementar un ABM completo (CRUD) de ingredientes que soporte este flag y permita el borrado lógico.

## 2. Proposed Solution
Se extenderá el modelo de datos `Ingrediente` actual agregando un campo booleano `es_alergeno`.
Se construirá un módulo completo en el Backend (`app/modules/ingredientes`) con Router, Service, Schemas y Tests para manejar las operaciones CRUD, protegiendo las rutas de escritura con el middleware de roles.
En el Frontend, se construirá la página de administración de ingredientes con filtros rápidos y la posibilidad de crear/editar a través de un Modal.

## 3. Scope and Capabilities

### In Scope
- **Backend:**
  - Migración Alembic para agregar `es_alergeno` a `Ingrediente`.
  - Crear endpoints CRUD (`GET`, `POST`, `PUT`, `DELETE`).
  - Endpoint `GET` con soporte de filtrado opcional `?esAlergeno=true` y búsqueda por texto.
  - Reglas de negocio: nombre único, soft delete (evitando borrado si está asociado a productos activos).
- **Frontend:**
  - Componente de UI para gestión (tabla).
  - Badge visual en color rojo/naranja para los ingredientes que sean alérgenos.
  - Filtros en la vista de lista.
  - Modal Form para crear y editar.

### Out of Scope
- Gestión de asociaciones entre productos e ingredientes (eso corresponde a `02-productos-catalogo`).
- Imágenes para ingredientes.

## 4. Technical Approach
- **Database:** Agregar columna `es_alergeno` (Boolean) con default `False`.
- **Backend:** Similar a Categorías, usaremos inyección de dependencias y `SQLModel`. Implementar `IngredienteService` con `soft_delete`.
- **Frontend:** Uso de TanStack Query para fetch y mutate. Componente basado en FSD (Feature-Sliced Design) en `features/ingredientes` y page en `pages/IngredientesPage.tsx`.

## 5. Risk Assessment
- **Riesgo:** Confusión si un ingrediente se borra pero está asociado a un producto vendido.
  - **Mitigación:** Usar Soft Delete. Impedir Soft Delete si el ingrediente tiene asociación activa en la tabla `productos_ingredientes`.
