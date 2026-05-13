# Tasks — fix/roles-y-migraciones

**Change ID**: fix/roles-y-migraciones  
**Estado**: completed  

---

## Tareas de Implementación

### Backend — Modelos y Base

- [x] **T-01** `db/base.py`: Reemplazar `datetime.utcnow` por `datetime.now(timezone.utc)` en `TimestampMixin`
- [x] **T-02** `db/models/usuario.py`: Corregir `RolEnum` → valores del dominio (`admin`, `stock`, `pedidos`, `client`)
- [x] **T-03** `db/models/usuario.py`: Remover imports no usados (`Integer`, `DateTime`, `Boolean`)
- [x] **T-04** `db/models/usuario.py`: Reescribir `RefreshToken.replaced_by` self-referential usando `sqlalchemy.orm.relationship()` con `foreign_keys`, `remote_side` y `overlaps` correctos
- [x] **T-05** `db/models/usuario.py`: Corregir `replaced_by_id` column — usar `sa_column=Column(ForeignKey(...))` en vez de `Field(foreign_key=...)` para evitar conflicto con `sa_column`

### Backend — Seed

- [x] **T-06** `db/seed.py`: Actualizar roles → `admin`, `stock`, `pedidos`, `client` con descripciones en español
- [x] **T-07** `db/seed.py`: Admin email → `admin@foodstore.com`, password → `Admin1234!`

### Backend — Auth Service

- [x] **T-08** `modules/auth/service.py`: `register()` asigna rol `"client"` (no `"customer"`)
- [x] **T-09** `modules/auth/service.py`: `register()` setea `apellido=None` (no string vacío)
- [x] **T-10** `modules/auth/service.py`: `register()` obtiene roles desde DB para el access token (no hardcoded)
- [x] **T-11** `modules/auth/service.py`: `register()` hace `session.refresh(new_user)` para que `created_at`/`updated_at` estén disponibles antes de construir el response
- [x] **T-12** `modules/auth/service.py`: `login()` verifica `user.activo` antes de emitir tokens
- [x] **T-13** `modules/auth/service.py`: `get_user_roles()` usa join explícito (`.join(UsuarioRol, UsuarioRol.rol_id == Rol.id)`)
- [x] **T-14** `modules/auth/service.py`: `_create_refresh_token_record()` usa `datetime.now(timezone.utc)` (ya resuelto por T-01)
- [x] **T-15** `modules/auth/service.py`: `refresh()` simplificar — eliminar parche `.replace(tzinfo=timezone.utc)` (ya resuelto por T-01)

### Backend — Routers

- [x] **T-16** `modules/pedidos/router.py`: `_is_admin()` usa `user.roles` (list[str]) en vez de `user.rol.nombre`
- [x] **T-17** `modules/auth/router.py`: Actualizar docstring CUSTOMER → CLIENT

### Migraciones

- [x] **T-18** `alembic/versions/`: Generar migración inicial `c079f7888238_initial_schema.py` con las 16 tablas del dominio
- [x] **T-19** `alembic/versions/`: Agregar `import sqlmodel` a la migración (autogenerate lo omite)
- [x] **T-20** `backend/.gitignore`: Remover `alembic/versions/` del ignore

### Validación

- [x] **T-21** Aplicar migración: `alembic upgrade head`
- [x] **T-22** Ejecutar seed: `python -m app.db.seed`
- [x] **T-23** Verificar roles en DB: `SELECT nombre FROM roles ORDER BY id`
- [x] **T-24** Validar imports en container: `python -c "from app.db.models.usuario import ..."`

---

## Pendiente de Validación Manual

- [ ] **T-25** `POST /auth/register` → verificar response 201 con `user.roles = ["client"]`
- [ ] **T-26** `POST /auth/login` → verificar response 200 con tokens
- [ ] **T-27** `GET /auth/me` → verificar response con usuario actual
- [ ] **T-28** `POST /auth/login` con usuario `activo=false` → verificar 401
