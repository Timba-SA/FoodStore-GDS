# Auth API — Referencia de Endpoints

**Prefijo:** `/api/v1/auth`  
**Content-Type:** `application/json`

---

## Endpoints

### `POST /register`

Registra un nuevo usuario con rol `CUSTOMER`.

**Rate limit:** 3 req/min por IP

**Request body:**
```json
{
  "nombre": "Juan Pérez",
  "email": "juan@example.com",
  "password": "MiPass123!",
  "numero_telefono": "+5491123456789"
}
```

| Campo | Tipo | Requerido | Validación |
|-------|------|-----------|-----------|
| `nombre` | string | ✅ | 2–100 chars |
| `email` | string (email) | ✅ | formato válido, único |
| `password` | string | ✅ | mín. 8 chars |
| `numero_telefono` | string | ❌ | — |

**Response 201:**
```json
{
  "access_token": "<jwt>",
  "refresh_token": "<uuid>",
  "token_type": "Bearer",
  "user": {
    "id": 1,
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "numero_telefono": "+5491123456789",
    "roles": ["customer"],
    "creado_en": "2026-05-11T14:00:00Z",
    "actualizado_en": "2026-05-11T14:00:00Z"
  }
}
```

**Errores:**
| Status | `error` | Causa |
|--------|---------|-------|
| 409 | `email_conflict` | Email ya registrado |
| 422 | — | Validación Pydantic |
| 429 | `rate_limit_exceeded` | Más de 3 req/min |

---

### `POST /login`

Autentica usuario y emite tokens.

**Rate limit:** 5 req/min por IP

**Request body:**
```json
{
  "email": "juan@example.com",
  "password": "MiPass123!"
}
```

**Response 200:** igual a `/register`

**Errores:**
| Status | `error` | Causa |
|--------|---------|-------|
| 401 | `invalid_credentials` | Email o contraseña incorrectos (sin distinguir cuál) |
| 429 | `rate_limit_exceeded` | Más de 5 req/min |

---

### `POST /refresh`

Rota el refresh token y emite un nuevo par de tokens.

**Rate limit:** 10 req/min por IP

**Request body:**
```json
{
  "refresh_token": "<uuid>"
}
```

**Response 200:** igual a `/register`

**Errores:**
| Status | `error` | Causa |
|--------|---------|-------|
| 401 | `invalid_refresh_token` | Token no encontrado o malformado |
| 401 | `token_expired` | Token expirado |
| 401 | `token_replay_detected` | Token ya usado (replay attack) — **toda la familia se revoca** |
| 429 | `rate_limit_exceeded` | Más de 10 req/min |

> **Replay detection:** Si un refresh token ya revocado es presentado, el servidor revoca **toda la familia** de tokens del usuario (misma `family_id`). El cliente es redirigido al login.

---

### `POST /logout`

Revoca el refresh token actual. **Idempotente.**

**Request body:**
```json
{
  "refresh_token": "<uuid>"
}
```

**Response 200:**
```json
{
  "message": "Logged out successfully"
}
```

> Devuelve 200 incluso si el token no existe o ya fue revocado. El cliente SIEMPRE debe descartar ambos tokens localmente.

---

### `GET /me`

Retorna el perfil del usuario autenticado.

**Headers:** `Authorization: Bearer <access_token>`

**Response 200:**
```json
{
  "id": 1,
  "nombre": "Juan Pérez",
  "email": "juan@example.com",
  "numero_telefono": null,
  "roles": ["customer"],
  "creado_en": "2026-05-11T14:00:00Z",
  "actualizado_en": "2026-05-11T14:00:00Z"
}
```

**Errores:**
| Status | `error` | Causa |
|--------|---------|-------|
| 401 | `missing_token` | Header `Authorization` ausente |
| 401 | `invalid_token` | Token inválido o expirado |

---

## Formato de error estándar

Todos los errores de auth siguen este contrato:

```json
{
  "detail": {
    "error": "<error_code>",
    "message": "<descripción legible>"
  }
}
```

Los errores 429 incluyen campos extra y headers:

```json
{
  "error": "rate_limit_exceeded",
  "message": "Too many requests. Please retry after 60 seconds.",
  "retry_after": 60
}
```

Headers: `Retry-After: 60`, `X-RateLimit-Limit: 5/minute`, `X-RateLimit-Reset: <unix timestamp>`

---

## Token lifetimes

| Token | Duración | Configurable |
|-------|----------|-------------|
| Access token (JWT) | 30 min | `ACCESS_TOKEN_EXPIRE_MINUTES` |
| Refresh token (UUID) | 7 días | `REFRESH_TOKEN_EXPIRE_DAYS` |

---

## Seguridad

- Contraseñas hasheadas con **bcrypt** (cost >= 12)
- Refresh tokens almacenados como **SHA-256 hash** en BD
- JWT firmado con **HS256** usando `SECRET_KEY`
- Login no distingue "email no existe" vs "contraseña incorrecta" (timing-safe)
