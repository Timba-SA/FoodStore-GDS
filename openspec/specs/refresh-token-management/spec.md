# Spec: refresh-token-management

## Purpose

Define the secure refresh token storage, validation, rotation, and revocation lifecycle.

## Requirements

### Data Storage

**Table**: `RefreshToken`
- `id`: UUID v4, primary key
- `usuario_id`: Foreign key to Usuario
- `token`: String (UUID v4, unique)
- `familia_id`: UUID v4, groups related tokens to detect replays
- `expirado_en`: Timestamp (calculated as creado_en + 7 days)
- `revocado_en`: Timestamp (nullable, set when token is invalidated)
- `creado_en`: Timestamp (auto-generated)
- `usado_en`: Timestamp (nullable, set when token is used to refresh)

### Validation Rules

- Token must exist in database
- Token must not be revoked (`revocado_en IS NULL`)
- Token must not be expired (`expirado_en > NOW()`)
- Token must belong to an active user (Usuario not soft-deleted)

### Rotation Mechanism

When a refresh token is used to obtain a new access token:

1. **Validate**: Verify token exists, is not revoked, is not expired
2. **Detect Replay**: If token was already used (`usado_en IS NOT NULL`), it indicates a replay attack
   - Revoke ALL refresh tokens in the same familia_id
   - Return 401 with message "Token reuse detected; please re-authenticate"
   - Log security incident
3. **If Valid**: 
   - Mark current token as used (`usado_en = NOW()`)
   - Create new refresh token with new `familia_id`
   - Generate new access token
   - Return both tokens to client

### Explicit Revocation (Logout)

When user calls logout endpoint:

1. Receive the current refresh token
2. Set `revocado_en = NOW()` for that token
3. No need to revoke entire familia — just this one token
4. Client removes tokens from localStorage
5. Access token continues to work until natural expiration (no server-side invalidation)

### Token Cleanup

- Expired refresh tokens can be deleted periodically (daily cron or lazy cleanup)
- Revoked tokens should be retained for at least 7 days for audit trail
- No user-facing cleanup required; system handles internally

### Error Responses

- **401 Unauthorized**: Token invalid, expired, revoked, or user not found
  - Message: "Token inválido o expirado"
  - No distinction between failure reasons (security best practice)
- **400 Bad Request**: Malformed token (not valid UUID)
  - Message: "Formato de token inválido"

## Design Notes

- Familia de tokens: Each token family represents a "session" starting from login
- Replays detected if same token used twice within rotation window
- Database queries must include time-based checks in WHERE clause
- Automatic cleanup of expired tokens is a background task (not within scope of this spec)
- Refresh tokens are never transmitted to frontend as plain cookies; returned in response body only
