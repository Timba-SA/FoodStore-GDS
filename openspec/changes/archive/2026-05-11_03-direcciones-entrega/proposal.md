# SDD Proposal: 03-direcciones-entrega

## 1. Context
The user has requested the implementation of Epic 03: Delivery Addresses Management (`03-direcciones-entrega`). This module allows authenticated users to manage their delivery addresses (CRUD) and select a default/principal address.

### Discrepancy Found
The `CHANGES.md` document lists the expected fields as: `alias, linea1, linea2, ciudad, codigo_postal, referencia, es_principal`.
However, during the `sdd-explore` phase, we verified that the existing `DireccionEntrega` model in `backend/app/db/models/usuario.py` has the following fields:
- `calle` (String)
- `numero` (String)
- `departamento` (String, optional)
- `ciudad` (String)
- `provincia` (String)
- `codigo_postal` (String)
- `pais` (String, default "Argentina")
- `es_predeterminada` (Boolean, default False)

**Decision**: We will adapt the implementation to use the **existing database schema** (`calle`, `numero`, `es_predeterminada`, etc.) to avoid unnecessary database migrations. This aligns with the database that is already seeded and migrated.

## 2. Proposed Architecture

### 2.1 Backend (FastAPI + SQLModel)
- **Service Layer (`DireccionService`)**:
  - `create`: Will ensure that if it's the user's first address, `es_predeterminada` is set to `True`. If the user passes `es_predeterminada=True`, all other addresses for this user will be updated to `False` to maintain the "only one default" rule.
  - `get_all_by_user`: Retrieves only the addresses belonging to the authenticated user.
  - `update` / `delete`: Will include a strict ownership check (`usuario_id == current_user.id`) to prevent users from modifying or deleting others' addresses.
  - `set_default`: A dedicated method to mark a specific address as default, toggling the others off.
- **Router (`direcciones_router`)**:
  - `GET /direcciones`: List user's addresses.
  - `POST /direcciones`: Create an address.
  - `PUT /direcciones/{id}`: Update an address.
  - `DELETE /direcciones/{id}`: Delete an address.
  - `PATCH /direcciones/{id}/principal`: Mark as default (`es_predeterminada`).
  - **Auth**: All endpoints will be protected with `Depends(get_current_user)`, using the standard client role (or any authenticated role).

### 2.2 Frontend (React + TS + Vite)
- **State Management**:
  - `api.ts` and `hooks.ts` inside `src/entities/direccion/` utilizing TanStack Query for caching and mutations.
- **Components**:
  - `DireccionList`: Renders a grid or list of addresses. Highlights the default address.
  - `DireccionFormModal`: A modal to create or edit an address.
- **Pages**:
  - `MisDireccionesPage`: A page inside the user's dashboard to manage their addresses.

## 3. Trade-offs and Considerations
- **Database Consistency vs Spec Compliance**: We are choosing database consistency over exact spec compliance for the fields, which is safer and faster.
- **Transactions**: Setting a new default address requires updating multiple rows (setting the new one to `True`, and all others to `False`). This must be done within a single `session.commit()` to ensure atomic updates and prevent the user from having no default or multiple defaults if an error occurs mid-way.

## 4. Next Steps
If this proposal is approved, we will proceed to generate the `design.md` and `tasks.md` specs.
