# Technical Design: Categorías Jerárquicas

## 1. Architectural Approach
Mantendremos la simplicidad del patrón de arquitectura en capas actual: Router -> Dependency Injection (auth/session) -> Service -> SQLAlchemy Model.

## 2. Models / Schema Changes
El modelo `Categoria` se modificará para incluir:
- `parent_id`: `Optional[int] = Field(default=None, foreign_key="categorias.id")`
- `children`: Relación One-to-Many con la misma tabla (`Relationship(back_populates="parent")`)
- `parent`: Relación Many-to-One con la misma tabla (`Relationship(back_populates="children")`)

Dado que es un cambio en el schema, se deberá crear una migración de **Alembic**:
`alembic revision --autogenerate -m "Add parent_id to Categoria"`

## 3. API Contract Changes

### `GET /api/v1/categorias`
Devolverá todas las categorías. Se puede proveer un flag `tree=true` opcional para indicar si el backend debe mandar la data plana (por defecto) o anidada en un árbol con la propiedad `children`.

**Response (Tree Mode):**
```json
[
  {
    "id": 1,
    "nombre": "Alimentos",
    "children": [
      {
        "id": 2,
        "nombre": "Bebidas",
        "parent_id": 1,
        "children": []
      }
    ]
  }
]
```

### `POST /api/v1/categorias` y `PUT /api/v1/categorias/{id}`
- **Auth:** Requiere `ADMIN` o `STOCK`.
- Validaciones en `PUT`: 
  - `parent_id` no puede ser igual a `id` (auto-referencia).
  - El nuevo `parent_id` no puede pertenecer a ningún sub-nodo descendiente de `id`.

### `DELETE /api/v1/categorias/{id}`
- **Auth:** Requiere `ADMIN` o `STOCK`.
- Efectúa un soft-delete seteando `deleted_at` a la fecha actual.
- Falla (400) si la categoría tiene `children` que no están eliminadas, o si tiene `productos_categorias` activos.

## 4. Algoritmo de Prevención de Ciclos
Para evitar armar lógicas complejas en el momento, y dado que la base de datos no será enorme, al hacer `PUT` de una categoría con un `parent_id`:
1. Si `parent_id == id`, lanzar error.
2. Hacer un query recursivo CTE (o una búsqueda recursiva simple en Python en memoria de la lista plana de padres) para comprobar que recorriendo la jerarquía hacia arriba del nuevo `parent_id` nunca nos encontremos con `id`. 

## 5. UI / UX Design
- Una vista de **Administración de Categorías** accesible a ADMIN/STOCK.
- Se recomienda usar una tabla normal para la administración, con un indicador visual (ej. sangría o un badge `Padre: Alimentos`) para la jerarquía, simplificando la UI respecto a un componente de drag and drop complejo.
- El formulario de edición/creación incluirá un Select para elegir la "Categoría Padre" (mostrando solo opciones válidas).
