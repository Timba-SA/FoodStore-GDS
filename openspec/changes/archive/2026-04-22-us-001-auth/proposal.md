# Proposal: us-001-auth — User Registration with JWT Authentication

## Why

The platform requires a foundational user management and authentication system. **US-001-auth** establishes client registration with bcrypt hashing and automatic CLIENT role assignment. This is a **prerequisite** for every feature that comes after — clients cannot use the platform without registering first.

This change unlocks the entire authentication pipeline (login, token refresh, logout) and enables role-based access control downstream.

## What Changes

- **New endpoint**: `POST /api/v1/auth/register` — accepts name, email, password, optional phone; returns access + refresh tokens and user data
- **New user model** with bcrypt-hashed passwords (cost factor ≥ 10) and automatic CLIENT role assignment
- **Email uniqueness constraint** with index for login optimization
- **Frontend registration form** with validation, error handling, and automatic auth store update
- **Password validation**: minimum 8 characters enforced in schemas
- **Automatic token initialization**: upon successful registration, client is logged in immediately with fresh tokens

## Capabilities

### New Capabilities

- `user-auth`: JWT-based authentication system with access token (30min) and refresh token (7days)
- `user-registration`: Client self-service registration with password hashing and automatic CLIENT role
- `refresh-token-management`: Secure refresh token storage and rotation mechanism

### Modified Capabilities

- (none — this is foundational, no prior specs to modify)

## Impact

**Backend**:
- New module: `app/auth/` (model, schema, repository, service, router)
- New module: `app/refreshtokens/` (model, schema, repository, service)
- Core dependencies: SQLModel, Passlib[bcrypt], python-jose/PyJWT
- Database: `Usuario` and `RefreshToken` tables (already in schema from US-000b)

**Frontend**:
- New module: `features/auth/` (RegisterForm, login logic)
- Zustand: `authStore` for token/user state with localStorage persistence
- New pages: `/register`, `/login`
- Axios interceptor: automatic token attachment and refresh on 401

**API Changes**:
- `POST /api/v1/auth/register` — new endpoint
- Prerequisite for: `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh` (US-002, US-003)

**Depends On**:
- ✅ US-000a (FastAPI setup)
- ✅ US-000b (Database tables + seed data)
- ✅ US-000d (BaseRepository, UnitOfWork, dependencies)
- ✅ US-000e (Zustand authStore configuration)

---

## Notes

- Password is hashed server-side, never stored in plain text (RN-AU01)
- Newly registered clients automatically get CLIENT role (RN-AU07)
- Email is validated with RFC 5322 simplificado and enforced UNIQUE
- Registration response matches login response format (TokenResponse schema)
- No email verification or OTP in MVP — registration is immediately active
