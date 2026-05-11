# Tasks: us-002-auth-jwt-register-login

## 1. Backend endpoints (login/refresh/logout/me)

- [x] 1.1 Confirm auth router paths and response schemas for login/refresh/logout/me per specs
- [x] 1.2 Implement login handler to verify credentials, issue access/refresh JWTs, and return standardized body
- [x] 1.3 Implement refresh handler to validate token, rotate, and return new pair with standardized errors
- [x] 1.4 Implement logout handler to revoke refresh token and return 200/401
- [x] 1.5 Ensure /auth/me uses access token and returns user payload per spec

## 2. Refresh token rotation and replay detection

- [x] 2.1 Create Alembic migration for refresh_tokens columns (token_hash, revoked_at, replaced_by_id, family_id, last_used_at) and backfill
- [x] 2.2 Update RefreshToken SQLModel and CRUD to hash tokens and query by token_hash/family_id
- [x] 2.3 Implement rotation logic to mark used tokens, insert new token, and link replaced_by_id
- [x] 2.4 Implement replay detection to revoke family and return 401 with standardized error
- [x] 2.5 Map invalid/expired/malformed refresh tokens to spec error messages

## 3. Rate limiting

- [x] 3.1 Configure slowapi limiter and key function (IP) to emit standard rate limit headers
- [x] 3.2 Apply rate limits to login, register, and refresh endpoints per spec limits
- [x] 3.3 Standardize 429 error body and Retry-After for rate-limited responses

## 4. Frontend auth flow

- [x] 4.1 Update authStore to be the source of truth and persist access/refresh via Zustand storage
- [x] 4.2 Refactor Axios client to read/write tokens via the store, not localStorage
- [x] 4.3 Implement single-flight refresh queue in interceptor and retry pending requests with new access token
- [x] 4.4 Update auth API calls (login/refresh/logout/me) and error mapping to match backend contract

## 5. Tests

- [x] 5.1 Add backend tests for login/refresh/logout/me success and failure scenarios
- [x] 5.2 Add rotation/replay tests verifying family revocation and 401 on reused tokens
- [x] 5.3 Add rate limit tests for login/register/refresh returning 429 with standard body

## 6. Docs

- [x] 6.1 Update API docs with auth endpoints, token lifetimes, and error format
- [x] 6.2 Document frontend auth flow, token storage decisions, and refresh single-flight behavior
