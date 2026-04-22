# Spec: user-auth

## Purpose

Define the JWT-based authentication system with access and refresh token lifecycle.

## Requirements

### Access Token

- **Payload**: `{ userId, email, roles: string[], exp }`
- **Algorithm**: HS256 (symmetric, using SECRET_KEY)
- **Duration**: 30 minutes from issuance
- **Transmitted via**: `Authorization: Bearer <token>` header
- **Used for**: Authenticating API requests; contains claim to identify the user

### Refresh Token

- **Type**: Opaque string (UUID v4)
- **Storage**: Database table `RefreshToken` linked to `Usuario.id`
- **Duration**: 7 days from issuance
- **Rotation**: Each use invalidates the previous token and issues a new one
- **Replay detection**: Marked `revocado_en` if reused (already used), triggering user to re-authenticate
- **Invalidation**: Can be revoked explicitly (logout) or automatically (expiration, reuse)

### Endpoint: GET /api/v1/auth/me

- **Description**: Verify current user identity
- **Auth Required**: Yes (access token in header)
- **Returns**: `{ id, nombre, email, telefono, roles, creado_en, actualizado_en }`
- **Status Codes**: 200 (success), 401 (invalid/expired token)

### Error Handling

- Invalid token → 401 Unauthorized with message "Token inválido o expirado"
- Expired token → 401 Unauthorized with message "Token expirado"
- Missing token → 401 Unauthorized with message "Token requerido"
- Malformed token → 401 Unauthorized with message "Formato de token inválido"

### Security Rules

- Tokens are stateless (server doesn't store access tokens)
- Refresh tokens are stateful (stored in DB with expiration + revocation tracking)
- All tokens include timestamp to allow revocation of entire sessions if compromised
- No token data is exposed in error messages beyond "invalid" or "expired"

## Design Notes

- Use `python-jose` or `PyJWT` for token generation/validation
- Decode logic handled by FastAPI dependency `get_current_user`
- Refresh logic stores token family ID to detect replays within same family
- Database cleanup: Remove expired refresh tokens in background job or lazy cleanup
