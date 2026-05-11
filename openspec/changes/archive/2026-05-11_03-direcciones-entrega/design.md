# SDD Design: 03-direcciones-entrega

## 1. Backend Design

### 1.1 Pydantic Schemas (`backend/app/modules/usuarios/schemas_direcciones.py`)
Since this is related to the user, we will place the schemas inside `app/modules/usuarios/` or create a new module `app/modules/direcciones/`. Given it's a specific domain, we will create `app/modules/direcciones/`.
- `DireccionCreate`: `calle`, `numero`, `departamento` (opt), `ciudad`, `provincia`, `codigo_postal`, `pais` (opt, default="Argentina"), `es_predeterminada` (bool, default=False).
- `DireccionUpdate`: All fields optional.
- `DireccionResponse`: Includes `id`, `usuario_id`, plus all model fields.

### 1.2 Service Layer (`backend/app/modules/direcciones/service.py`)
Class `DireccionService`:
- `get_by_usuario(usuario_id: int) -> list[DireccionEntrega]`
- `get_by_id(direccion_id: int, usuario_id: int) -> DireccionEntrega`: Retrieves by ID, strictly filtering by `usuario_id` to enforce ownership.
- `create(usuario_id: int, payload: DireccionCreate) -> DireccionEntrega`:
  - If it's the first address for the user, set `es_predeterminada = True` regardless of the payload.
  - If `payload.es_predeterminada` is `True`, first update all existing addresses for this `usuario_id` to `es_predeterminada = False`.
- `update(direccion_id: int, usuario_id: int, payload: DireccionUpdate) -> DireccionEntrega`:
  - If `payload.es_predeterminada` is `True`, handle the toggle logic (unset others).
- `delete(direccion_id: int, usuario_id: int) -> None`:
  - If the deleted address was the default one, ideally promote the most recently updated remaining address to default (optional UX improvement, or simply let the user have no default until they set one). We will implement a basic hard/soft delete (the model doesn't currently have `deleted_at`, but `CHANGES.md` mentions soft delete. Let's check: the actual model *doesn't* have `deleted_at`, `activo` or similar. If there's no soft-delete field, we will do a **hard delete** to avoid schema changes, since adapting the DB schema is our priority).
  - *Correction*: The proposal said we stick to the DB schema. The DB schema doesn't have `deleted_at`. We will do a hard delete.
- `set_default(direccion_id: int, usuario_id: int) -> DireccionEntrega`:
  - Dedicated method to update `es_predeterminada = False` for all user addresses, then `True` for the specified one.

### 1.3 Router (`backend/app/modules/direcciones/router.py`)
Endpoints protected with `Depends(get_current_user)`.
- `GET /direcciones`: Calls `service.get_by_usuario(current_user.id)`.
- `POST /direcciones`: Calls `service.create(current_user.id, payload)`.
- `PUT /direcciones/{id}`: Calls `service.update(id, current_user.id, payload)`.
- `DELETE /direcciones/{id}`: Calls `service.delete(id, current_user.id)`.
- `PATCH /direcciones/{id}/principal`: Calls `service.set_default(id, current_user.id)`.

## 2. Frontend Design

### 2.1 State Management (`frontend/src/entities/direccion/`)
- `types.ts`: `Direccion`, `DireccionCreatePayload`, `DireccionUpdatePayload`.
- `api.ts`: API wrapper using Axios (`client.ts`).
- `hooks.ts`: React Query hooks (`useDirecciones`, `useCreateDireccion`, `useUpdateDireccion`, `useDeleteDireccion`, `useSetDireccionPrincipal`).

### 2.2 Components & Pages (`frontend/src/features/direcciones/`)
- `DireccionCard`: Displays address details. Shows a prominent "Predeterminada" badge if applicable. Includes "Editar", "Eliminar" and "Fijar como predeterminada" actions.
- `DireccionFormModal`: Form for creating/editing with fields matching the backend schema.
- `MisDireccionesPage` (Route: `/dashboard/direcciones`): The main page rendering the list of `DireccionCard`s and the "Agregar Dirección" button. Protected by `ProtectedRoute` (requires login, but no specific admin role).

## 3. Testing Strategy (Strict TDD)
- **Unit Tests (`tests/test_direcciones.py`)**:
  - Test ownership: Trying to get/update/delete an address with a different `usuario_id` raises a 404 or ValueError.
  - Test default toggle: Creating an address with `es_predeterminada=True` correctly sets others to `False`.
  - Test first address: Creating the very first address forces `es_predeterminada=True`.
