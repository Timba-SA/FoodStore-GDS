## Why

Hoy el sistema solo permite **registro** (US-001). Sin login, refresh y logout, los usuarios no pueden volver a entrar, ni mantener sesiones seguras. Además, falta protección contra abuso (rate limiting) en endpoints sensibles. Este change completa el flujo de autenticación y habilita el resto de features dependientes.

## What Changes

- Agregar endpoints de **login**, **refresh** y **logout** con JWT access + refresh tokens.
- Implementar **rotación de refresh tokens** y detección de reuso (replay).
- Incorporar **rate limiting** en endpoints sensibles (login, registro, refresh, creación de pedidos según RN-AU06 / US-073).
- Estandarizar respuestas de error de auth (401/403/429) para frontend.

## Capabilities

### New Capabilities
- `auth-rate-limiting`: reglas y límites para endpoints sensibles de autenticación.

### Modified Capabilities
- `user-auth`: ampliar requisitos para incluir endpoints de login/refresh/logout y sus respuestas.
- `refresh-token-management`: confirmar reglas de rotación, revocación y replay detection en flujo de refresh/logout.

## Impact

- **Backend**: nuevos endpoints `/api/v1/auth/login`, `/api/v1/auth/refresh`, `/api/v1/auth/logout`; lógica de rate limiting y validaciones.
- **Frontend**: flujo de login, refresh automático en interceptor, y logout con limpieza de tokens.
- **Seguridad**: endurecimiento de sesión con rotación de refresh tokens y protección anti-fuerza bruta.
- **Dependencias**: usa infraestructura ya creada en Sprint 0 y US-001 (user, tokens, stores).
