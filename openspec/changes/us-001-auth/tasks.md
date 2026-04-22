# Tasks: us-001-auth

## Implementation Checklist

### Backend: Schemas (Pydantic v2)

- [ ] **T-001**: Create `backend/app/auth/schemas.py`
  - [ ] `RegisterRequest` schema with nombre, email, password, telefono (optional)
  - [ ] `LoginRequest` schema (email, password) — for US-002, but placeholder for now
  - [ ] `TokenResponse` schema with access_token, refresh_token, token_type, user
  - [ ] `UserResponse` schema (id, nombre, email, telefono, roles, timestamps)
  - [ ] Add validators: email format, password length ≥ 8, nombre length 2-100

### Backend: Service Layer

- [ ] **T-002**: Create `backend/app/auth/service.py`
  - [ ] `AuthService` class with async `register()` method
  - [ ] Validate input (email, password, name)
  - [ ] Check email uniqueness (query Usuario table)
  - [ ] Hash password with bcrypt cost ≥ 10 using Passlib
  - [ ] Create Usuario record with hashed password via UoW
  - [ ] Assign CLIENT role (ID = 4) via UsuarioRol table
  - [ ] Create initial RefreshToken record
  - [ ] Generate access token (JWT, HS256, 30min expiry, claims: userId, email, roles)
  - [ ] Generate refresh token (UUID v4, store in DB)
  - [ ] Return TokenResponse with user data and tokens
  - [ ] Handle errors: duplicate email (409), validation (400), server error (500)

### Backend: Repository

- [ ] **T-003**: Extend `backend/app/usuarios/repository.py` (if not already complete)
  - [ ] Add method: `get_by_email(email: str)` — check email uniqueness
  - [ ] Ensure soft-delete is respected (excludes deleted users)

### Backend: Router

- [ ] **T-004**: Create `backend/app/auth/router.py`
  - [ ] `POST /api/v1/auth/register` endpoint
  - [ ] Request validation via Pydantic (schema validation automatic)
  - [ ] Call `AuthService.register()`
  - [ ] Return 201 Created with TokenResponse
  - [ ] Handle exceptions → proper HTTP status codes (409, 400, 500)

### Backend: Dependency Injection

- [ ] **T-005**: Register auth router in `backend/app/main.py`
  - [ ] `app.include_router(auth_router, prefix="/api/v1", tags=["auth"])`

### Frontend: Zustand Store Integration

- [ ] **T-006**: Verify/extend `frontend/src/shared/stores/authStore.ts`
  - [ ] State: `accessToken`, `refreshToken`, `user`, `isAuthenticated`
  - [ ] Action: `login(tokens, user)` — sets all state
  - [ ] Action: `logout()` — clears all state
  - [ ] Selector: `isAuthenticated()` — returns boolean
  - [ ] Persistence: localStorage with key `food-store-auth`
  - [ ] Partialize: Exclude loading states from persistence

### Frontend: API Client

- [ ] **T-007**: Create/extend `frontend/src/shared/api/auth.ts`
  - [ ] `registerUser(data: RegisterRequest): Promise<TokenResponse>`
  - [ ] Makes POST to `${apiUrl}/auth/register`
  - [ ] Returns parsed TokenResponse
  - [ ] Handles errors (catches and re-throws with user message)

### Frontend: RegisterForm Component

- [ ] **T-008**: Create `frontend/src/features/auth/RegisterForm.tsx`
  - [ ] Form fields: nombre, email, password, confirmPassword, telefono (optional)
  - [ ] Form validation: TanStack Form or Zod
  - [ ] Submit handler:
    - [ ] Call `registerUser()` from API
    - [ ] On success:
      - [ ] Update authStore: `authStore.login(response.access_token, response.refresh_token, response.user)`
      - [ ] Navigate to `/dashboard` or `/home`
    - [ ] On error:
      - [ ] Display field errors (400) or generic message (409, 500)
  - [ ] Preserve form state on component remount (via React Query or local state)

### Frontend: Register Page

- [ ] **T-009**: Create `frontend/src/pages/RegisterPage.tsx`
  - [ ] Render RegisterForm component
  - [ ] Redirect to dashboard if already authenticated
  - [ ] Display page layout (nav, footer, form container)
  - [ ] Link to login if user already has account

### Frontend: Routes

- [ ] **T-010**: Update `frontend/src/app/App.tsx` or router config
  - [ ] Add public route: `GET /register` → RegisterPage
  - [ ] Ensure `/login`, `/dashboard` exist (can be stubs for now)

### Frontend: Axios Interceptor Setup

- [ ] **T-011**: Ensure `frontend/src/shared/api/axios.ts` exists
  - [ ] Base URL from env var `VITE_API_URL`
  - [ ] Request interceptor: Add `Authorization: Bearer <token>` from authStore
  - [ ] Response interceptor: Handle 401 (token refresh) — placeholder for US-003
  - [ ] Error handler: Map error codes to user messages

### Testing: Backend Unit Tests

- [ ] **T-012**: Create `backend/tests/test_auth_service.py`
  - [ ] Test: `register_creates_user_with_client_role()`
  - [ ] Test: `register_hashes_password_with_bcrypt()`
  - [ ] Test: `register_rejects_duplicate_email()`
  - [ ] Test: `register_returns_valid_tokens()`
  - [ ] Test: `register_validates_email_format()`
  - [ ] Test: `register_validates_password_length()`

### Testing: Backend Integration Tests

- [ ] **T-013**: Create `backend/tests/test_auth_router.py`
  - [ ] Test: `POST /auth/register` with valid data returns 201
  - [ ] Test: `POST /auth/register` with duplicate email returns 409
  - [ ] Test: `POST /auth/register` with invalid email returns 400
  - [ ] Test: `POST /auth/register` with short password returns 400
  - [ ] Test: Response includes user data and tokens

### Testing: Frontend Component Tests

- [ ] **T-014**: Create `frontend/src/features/auth/__tests__/RegisterForm.test.tsx`
  - [ ] Test: Form renders all fields
  - [ ] Test: Submit with valid data calls API
  - [ ] Test: On success, updates authStore and navigates
  - [ ] Test: On error (409), displays error message
  - [ ] Test: Password confirmation validation

### Documentation

- [ ] **T-015**: Update backend README
  - [ ] Document registration endpoint: method, path, request/response examples
  - [ ] Document password hashing: bcrypt, cost factor
  - [ ] Document role assignment: CLIENT role automatic

- [ ] **T-016**: Update frontend README
  - [ ] Document RegisterPage usage
  - [ ] Document authStore integration
  - [ ] Document token lifecycle (stored in localStorage, used in axios)

### Manual Testing Checklist

- [ ] **T-017**: Test registration happy path
  - [ ] Navigate to `/register`
  - [ ] Fill form with valid data
  - [ ] Submit
  - [ ] Verify redirect to `/dashboard`
  - [ ] Verify tokens in localStorage
  - [ ] Verify authStore has user data

- [ ] **T-018**: Test error cases
  - [ ] Register with existing email → 409 error message
  - [ ] Register with short password → validation error
  - [ ] Register with invalid email → validation error
  - [ ] Empty fields → validation errors

---

## Effort Estimate

- **Backend Implementation**: 3-4 hours (service, router, tests)
- **Frontend Implementation**: 2-3 hours (form, store integration, routes)
- **Testing**: 1-2 hours (unit + integration + E2E)
- **Documentation**: 30 minutes

**Total**: ~7-10 hours

## Definition of Done

✅ All tasks completed (checkboxes marked)  
✅ All tests passing (backend + frontend)  
✅ No console warnings or errors  
✅ Manual testing confirms happy path and error cases  
✅ Code follows project conventions (naming, structure, imports)  
✅ Commit history is clean (meaningful commit messages per task)  
✅ Ready to deploy to staging/production  
