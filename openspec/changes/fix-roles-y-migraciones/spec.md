# Spec — fix/roles-y-migraciones

**Change ID**: fix/roles-y-migraciones  
**Estado**: implemented  
**Creado**: 2026-05-13  

---

## Contexto

El sistema tenía roles inconsistentes (`CUSTOMER`, `SELLER`, `MODERATOR`) que nunca coincidían con los roles que los routers protegidos esperaban (`admin`, `stock`, `pedidos`). Esto bloqueaba toda la capa de autorización.

---

## Requerimientos Funcionales

### RF-01 — Roles del Dominio
El sistema DEBE tener exactamente 4 roles:
- `admin` — acceso total al sistema
- `stock` — gestión de catálogo, productos e ingredientes  
- `pedidos` — gestión y seguimiento de pedidos
- `client` — usuario registrado del e-commerce

### RF-02 — Registro de Usuario
Al registrarse un nuevo usuario:
- Se le asigna el rol `client` automáticamente
- Se busca el rol en la tabla `roles` (no se hardcodea)
- Si el rol no existe, se crea (fallback defensivo)
- Se retorna `TokenResponse` con access token, refresh token y datos del usuario

### RF-03 — Login de Usuario
Al autenticarse:
- Se verifica email y contraseña
- Se verifica que `deleted_at IS NULL`
- Se verifica que `activo = TRUE` (usuarios suspendidos no pueden autenticarse)
- Se retorna `TokenResponse`

### RF-04 — Rotación de Refresh Tokens
Al rotar:
- Token válido → se revoca el viejo, se emite nuevo en la misma `family_id`
- Token ya revocado → replay detected → se revoca la familia completa → 401
- Token expirado → 401

### RF-05 — Migraciones
El schema DEBE estar versionado en Alembic.
La migración inicial DEBE cubrir las 16 tablas del dominio.

---

## Requerimientos No Funcionales

### RNF-01 — Timestamps Timezone-aware
Todos los timestamps del sistema DEBEN ser `timezone.utc` aware.  
No se permite `datetime.utcnow()` (deprecated Python 3.12+).

### RNF-02 — Self-referential FK en RefreshToken
`replaced_by_id` es una FK auto-referencial a `refresh_tokens.id`.  
La relación ORM DEBE definirse con `sqlalchemy.orm.relationship()` directamente  
(SQLModel `Relationship()` no soporta `remote_side` en self-referential).

### RNF-03 — Join Explícito en Queries
Todos los joins en SQLAlchemy async DEBEN ser explícitos:
```python
.join(UsuarioRol, UsuarioRol.rol_id == Rol.id)
```
No se permite `.join(UsuarioRol)` sin condición (no-determinístico en async).

### RNF-04 — Migraciones en Git
El directorio `alembic/versions/` DEBE estar en el repositorio.  
No debe estar en `.gitignore`.

---

## Escenarios (BDD-style)

```gherkin
Scenario: Registro exitoso
  Given el email "nuevo@example.com" no está registrado
  When POST /auth/register con nombre, email y password válidos
  Then se retorna 201 con access_token, refresh_token y user.roles = ["client"]
  And el usuario existe en la tabla usuarios con activo=true, verificado=false
  And existe un registro en usuario_roles con rol.nombre = "client"

Scenario: Registro con email duplicado
  Given el email "existente@example.com" ya está en la DB
  When POST /auth/register con ese email
  Then se retorna 409 con error "email_conflict"

Scenario: Login exitoso
  Given el usuario "admin@foodstore.com" existe con activo=true
  When POST /auth/login con credenciales correctas
  Then se retorna 200 con access_token y refresh_token

Scenario: Login con usuario suspendido
  Given el usuario "suspendido@example.com" existe con activo=false
  When POST /auth/login con credenciales correctas
  Then se retorna 401

Scenario: Replay detection en refresh
  Given un refresh token ya revocado
  When POST /auth/refresh con ese token
  Then se retorna 401 con error "token_replay_detected"
  And toda la familia de tokens queda revocada
```
