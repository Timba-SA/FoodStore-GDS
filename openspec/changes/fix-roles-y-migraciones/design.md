# Design — fix/roles-y-migraciones

**Change ID**: fix/roles-y-migraciones  
**Estado**: implemented  

---

## Decisiones de Diseño

### D-01 — Nomenclatura de Roles

**Decisión**: roles en minúscula sin espacios: `admin`, `stock`, `pedidos`, `client`.

**Alternativas consideradas**:
- Uppercase `ADMIN`, `STOCK` → descartado: los routers ya estaban en minúscula, cambiar requería más superficie
- `customer` en vez de `client` → descartado: el dominio especifica `client` en `CHANGES.md`

**Consecuencias**: `RolEnum` define estas constantes para evitar strings literales dispersos.

---

### D-02 — Self-referential FK en RefreshToken

**Problema**: `replaced_by_id` apunta a `refresh_tokens.id` para el audit trail de rotación.

**Decisión**: Usar `sqlalchemy.orm.relationship()` directamente con `foreign_keys` y `remote_side` explícitos como strings, envuelto en `Relationship(sa_relationship=...)` de SQLModel.

**Por qué no `Relationship()` puro**: SQLModel v0.x no soporta `remote_side` en `Relationship()` para self-referential. Lanza `AmbiguousForeignKeysError` en runtime.

**Por qué strings en `primaryjoin`**: SQLAlchemy lazy-evalúa strings cuando el mapper se configura, necesario para referencias circulares.

---

### D-03 — Timestamps Timezone-aware

**Problema**: `datetime.utcnow()` genera datetimes naive (sin tzinfo), causando `TypeError` al comparar con `datetime.now(timezone.utc)`.

**Decisión**: `BaseModel` usa `default_factory=_utcnow` donde `_utcnow = lambda: datetime.now(timezone.utc)`.

**Consecuencia**: elimina el parche `.replace(tzinfo=timezone.utc)` que existía en `auth/service.py:refresh()`.

---

### D-04 — Transaccionalidad en Register

**Problema**: `register()` hacía múltiples `flush()` pero nunca `commit()`. El commit lo gestiona el middleware de la sesión async (definido en `get_db` dependency).

**Decisión**: Mantener el patrón actual — el router abre la sesión con `async with session.begin()` (o similar), hacemos `flush()` para obtener IDs, y el commit ocurre al salir del context manager.

**Si get_db no tiene `begin()`**: agregar `await session.commit()` al final de `register()` antes del return. Verificar `dependencies.py`.

---

### D-05 — Join Explícito en get_user_roles

**Problema**: `.join(UsuarioRol)` sin condición falla en algunos engines async porque no puede inferir el join condition cuando hay múltiples FKs posibles.

**Decisión**: Siempre usar join explícito:
```python
.join(UsuarioRol, UsuarioRol.rol_id == Rol.id)
.where(UsuarioRol.usuario_id == user_id)
```

---

## Diagrama de Clases Simplificado

```
Usuario ──< UsuarioRol >── Rol
   │
   ├──< RefreshToken ──┐ (self-ref: replaced_by_id → id)
   └──< DireccionEntrega
```

---

## Archivos Afectados

| Archivo | Tipo de cambio |
|---------|----------------|
| `backend/app/db/base.py` | Fix: `datetime.utcnow` → `datetime.now(timezone.utc)` |
| `backend/app/db/models/usuario.py` | Fix: self-referential relationship, RolEnum, imports |
| `backend/app/db/seed.py` | Fix: roles domain, admin email/password |
| `backend/app/modules/auth/service.py` | Fix: join explícito, refresh activo, apellido=None, roles from DB |
| `backend/app/modules/auth/router.py` | Fix: docstring CUSTOMER → CLIENT |
| `backend/app/modules/pedidos/router.py` | Fix: `_is_admin()` uses `user.roles` list |
| `backend/alembic/versions/c079f7888238_initial_schema.py` | New: migración inicial 16 tablas |
| `backend/.gitignore` | Fix: removido `alembic/versions/` |
