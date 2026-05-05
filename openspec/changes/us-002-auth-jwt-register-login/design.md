## Context

El backend ya tiene registro basico y modelos de Usuario/Rol/RefreshToken, pero login/refresh/logout estan como placeholders. El frontend tiene `authStore` en Zustand y un cliente Axios que hoy lee tokens directo desde `localStorage` y reintenta 401 con refresh sin cola. El change requiere JWT access+refresh con rotacion, deteccion de reuso, rate limiting en endpoints sensibles y respuestas de error estandarizadas. Debe respetar FastAPI + SQLModel, arquitectura por modulos (feature-first) y FSD en frontend.

## Goals / Non-Goals

**Goals:**
- Implementar login, refresh y logout con JWT access (30m) + refresh (7d) y rotacion segura.
- Persistir refresh tokens en BD con revocacion y deteccion de replay.
- Aplicar rate limiting (slowapi) en login, register y refresh segun RN-AU06/US-073.
- Unificar contrato de respuesta y errores para el frontend.
- Actualizar flujo frontend: interceptor con refresh single-flight, store fuente de verdad.

**Non-Goals:**
- Implementar RBAC completo ni proteccion de rutas (es otro change).
- Migrar a cookies httpOnly o SSR (se mantiene SPA con Zustand).
- Implementar auditoria avanzada de sesiones (dispositivos, IP history).

## Decisions

1) **Refresh token con hash y rotacion en BD**
   - **Decision:** almacenar `token_hash` (SHA-256), `expires_at`, `revoked_at`, `replaced_by_id` (nullable) y `family_id` (UUID) para detectar reuso. El token en claro solo vive del lado cliente.
   - **Why:** reduce impacto si la BD se filtra y habilita deteccion de replay a nivel familia.
   - **Alternativas:**
     - Guardar token en claro (mas simple) → peor postura de seguridad.
     - Rotacion sin family_id (solo revoke) → no detecta replay de tokens antiguos de forma confiable.

2) **Replay detection = revocar familia completa**
   - **Decision:** si llega un refresh token ya revocado o usado, revocar TODOS los tokens activos del usuario (o de la family_id si se decide por familia).
   - **Why:** cumple RN-AU05 y limita sesion comprometida.
   - **Alternativas:**
     - Revocar solo token usado → ventana de abuso mayor.

3) **Single-flight refresh en frontend**
   - **Decision:** implementar cola de requests durante refresh y reintentar con el nuevo access token (un solo refresh concurrente).
   - **Why:** evita rafagas de refresh y condiciones de carrera (RN-US-066).
   - **Alternativas:**
     - Refresh por request → carga innecesaria y tokens inconsistentes.

4) **Tokens en Zustand + persist selectiva**
   - **Decision:** el auth state vive en `features/auth/store/authStore.ts`; persistir `accessToken` y `refreshToken` en storage configurado por Zustand, no acceder directo a `localStorage` desde el cliente HTTP.
   - **Why:** una sola fuente de verdad y consistencia con arquitectura FSD.
   - **Alternativas:**
     - Leer/escribir localStorage directo en `shared/api/client.ts` → acoplamiento y estado duplicado.

5) **Rate limiting con slowapi**
   - **Decision:** aplicar decoradores por endpoint (login, register, refresh) con limites de RN-AU06/US-073 y headers estandar (`Retry-After`, `X-RateLimit-*`).
   - **Why:** proteccion basica anti-fuerza bruta y abuso.
   - **Alternativas:**
     - Solo middleware global → menos granularidad.

## Risks / Trade-offs

- [Tokens en storage del cliente] → riesgo XSS si la app se compromete. Mitigacion: CSP basica, sanitizacion, evitar `dangerouslySetInnerHTML`, futura migracion a httpOnly cookies.
- [Rotacion con family_id] → requiere migracion de schema y logica extra. Mitigacion: migracion incremental y tests de refresh.
- [Rate limit en memoria] → no escala multi-instancia. Mitigacion: Redis en produccion.

## Migration Plan

1) Migracion Alembic: actualizar tabla `refresh_tokens` (token_hash, revoked_at, replaced_by_id, family_id, last_used_at) y backfill si hay datos existentes.
2) Actualizar modelos SQLModel y repositorios para nuevas columnas y queries por hash.
3) Implementar endpoints `/auth/login`, `/auth/refresh`, `/auth/logout` y dependencias de auth (get_current_user / require_role si aplica).
4) Ajustar cliente Axios y `authStore` para refresh single-flight y uso de store.
5) Verificar rate limiting y contratos de error RFC 7807.

## Open Questions

- ¿Se adopta revocacion por **usuario completo** o por **family_id** ante replay? (Recomendado: family_id si se implementa en DB, usuario completo si no).
- ¿Se mantiene storage en localStorage (via Zustand) o se migra a cookies httpOnly en una futura iteracion de seguridad?

## Sequence Diagram — Refresh Flow

```
Frontend (Axios)        Backend (FastAPI)           DB (RefreshToken)
     |                         |                          |
     | 401 from API            |                          |
     |------------------------>|                          |
     | refresh()               |                          |
     |------------------------>|  validate token hash     |
     |                         |------------------------->|
     |                         |  token valid?            |
     |                         |<-------------------------|
     |                         |  rotate + revoke old     |
     |                         |------------------------->|
     |                         |  insert new token        |
     |                         |<-------------------------|
     |<------------------------|  200 new tokens          |
     | update store + retry    |                          |
     |------------------------>| (original request)       |
```
