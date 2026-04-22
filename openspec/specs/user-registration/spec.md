# Spec: user-registration

## Purpose

Define the client self-service registration flow with password hashing and automatic role assignment.

## Requirements

### Endpoint: POST /api/v1/auth/register

**Request Body**:
```
{
  "nombre": string (min 2, max 100 chars),
  "email": string (valid RFC 5322 format),
  "password": string (min 8 chars, required),
  "telefono": string (optional, max 20 chars)
}
```

**Response** (201 Created):
```
{
  "access_token": string (JWT),
  "refresh_token": string (UUID),
  "token_type": "Bearer",
  "user": {
    "id": int,
    "nombre": string,
    "email": string,
    "telefono": string | null,
    "roles": ["CLIENT"],
    "creado_en": ISO8601 timestamp,
    "actualizado_en": ISO8601 timestamp
  }
}
```

### Validation Rules

- **Email**: Must be unique in database; return 409 Conflict if already registered
- **Email format**: Validated with regex matching RFC 5322 simplified
- **Password**: Minimum 8 characters required; no additional complexity rules in MVP
- **Nombre**: Non-empty, minimum 2 characters, maximum 100
- **Telefono**: Optional; if provided, validated as non-empty string
- **All fields**: Trimmed of leading/trailing whitespace

### Password Security

- **Algorithm**: bcrypt with cost factor ≥ 10 (RN-AU01)
- **Salt**: Automatically generated per password
- **Verification**: Never compare raw passwords; always use bcrypt verify
- **Stored**: Never log or expose raw passwords in any context

### Role Assignment

- Newly registered user receives exactly one role: `CLIENT` (ID = 4)
- Role is assigned automatically by the service layer, NOT from user input
- No option to request different role or provide role in request body

### Post-Registration State

- User is immediately authenticated (no email verification required in MVP)
- Tokens are immediately usable for subsequent API calls
- First login timestamp is set in `creado_en`
- User can proceed to login (US-002) if tokens expire

### Error Responses

- **400 Bad Request**: Validation failed (invalid email, short password, etc.)
  - Response includes detailed field errors: `{ field: string, message: string }[]`
- **409 Conflict**: Email already registered
  - Message: "El email ya está registrado"
- **500 Internal Server Error**: Database or hashing failure
  - No implementation details exposed

### Idempotency

- Registration is NOT idempotent — attempting to register the same email twice fails with 409
- The system does NOT provide email verification or account recovery in this change

## Design Notes

- Password hashing happens in the service layer before persistence
- Database transaction ensures atomicity: either user + role are created or nothing is created
- Response format exactly matches login response (TokenResponse schema) for consistency
- Frontend immediately updates authStore with returned tokens
