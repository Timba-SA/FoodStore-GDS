# Design: us-001-auth

## Architecture Overview

```
Frontend (React + Zustand)
        ↓
   RegisterForm.tsx
        ↓
   axios POST /api/v1/auth/register
        ↓
Backend (FastAPI)
    Router
        ↓
    Service (Hashing + Role Assignment + UoW)
        ↓
    Repository (User + RefreshToken)
        ↓
   PostgreSQL (Usuario + RefreshToken tables)
        ↓
   Zustand authStore (token persistence)
```

## Backend Implementation

### Module Structure

```
backend/app/auth/
├── model.py          # (already exists from US-000b, no changes needed)
├── schemas.py        # RegisterRequest, TokenResponse
├── repository.py     # UsuarioRepository (already exists)
├── service.py        # NEW - AuthService.register()
└── router.py         # NEW - POST /api/v1/auth/register

backend/app/refreshtokens/
├── model.py          # (already exists from US-000b)
├── schemas.py        # (simple, no changes needed for register)
├── repository.py     # (already exists, minimal changes)
└── service.py        # (not needed for register phase)
```

### AuthService.register() Logic

```python
async def register(
    request: RegisterRequest,
    uow: UnitOfWork
) -> TokenResponse:
    """
    1. Validate input (email format, password length, etc.)
    2. Check email uniqueness (query database)
    3. Hash password with bcrypt (cost ≥ 10)
    4. Create Usuario inside UoW
    5. Assign CLIENT role via UsuarioRol table
    6. Create initial RefreshToken
    7. Generate access + refresh tokens
    8. Return TokenResponse
    
    Atomicity: Entire operation is wrapped in UoW context
    On error: UoW rolls back, no partial data persists
    """
```

### Router Endpoint

```python
@router.post("/register", response_model=TokenResponse, status_code=201)
async def register_user(
    request: RegisterRequest,
    uow: UnitOfWork = Depends(get_unit_of_work)
):
    return await auth_service.register(request, uow)
```

### Schemas (Pydantic v2)

```python
# Input
class RegisterRequest(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=100)
    email: EmailStr  # Built-in RFC 5322 validation
    password: SecureStr = Field(..., min_length=8)
    telefono: Optional[str] = Field(None, max_length=20)

# Output (shared with login response)
class UserResponse(BaseModel):
    id: int
    nombre: str
    email: str
    telefono: Optional[str]
    roles: List[str]
    creado_en: datetime
    actualizado_en: datetime

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    user: UserResponse
```

## Frontend Implementation

### RegisterForm Component

```
RegisterForm.tsx
├── State: form values (nombre, email, password, confirmPassword)
├── Validation: TanStack Form or Zod schema
├── Submit Handler:
│   └── POST /api/v1/auth/register
│       ├── Success: 
│       │   ├── Update authStore (tokens + user)
│       │   └── Navigate to /dashboard or /home
│       └── Error:
│           └── Display field errors or generic message
└── UI: Form fields + password confirmation
```

### Zustand authStore Integration

```typescript
// authStore.ts already exists with:
const authStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  
  login: (tokens, user) => set({ accessToken, refreshToken, user }),
  logout: () => set({ accessToken: null, refreshToken: null, user: null }),
}));

// RegisterForm calls:
const { login } = authStore();
const response = await axios.post('/auth/register', data);
login(response.access_token, response.refresh_token, response.user);
```

### Routes

- **Public**: `GET /register` → RegisterForm page
- **Protected**: `GET /dashboard` → Redirect to /register if not authenticated

## Data Flow Example

### Happy Path: User Registers

```
1. User fills form: nombre="Juan", email="juan@example.com", password="SecurePass123"
2. RegisterForm submits POST /api/v1/auth/register
3. Backend Router receives request, validates schema
4. AuthService.register():
   - Query DB: SELECT * FROM Usuario WHERE email = 'juan@example.com'
   - Result: Not found ✓
   - Hash password: bcrypt.hash("SecurePass123", cost=10) → "$2b$10$..."
   - INSERT Usuario (nombre, email, hash, telefono, creado_en=NOW())
   - INSERT UsuarioRol (usuario_id=42, rol_id=4) [CLIENT role]
   - INSERT RefreshToken (usuario_id=42, token=UUID(...), expirado_en=NOW()+7days)
   - Generate JWT: { userId: 42, email: "juan@...", roles: ["CLIENT"], exp: NOW()+30min }
   - COMMIT transaction ✓
5. Return TokenResponse
6. Frontend receives response, updates authStore
7. localStorage persists tokens (via Zustand middleware)
8. User is logged in, can proceed

### Error Case: Email Already Exists

```
1. User attempts register with email already in database
2. AuthService checks email uniqueness
3. Query returns: Usuario found
4. Raise HTTPException(status_code=409, detail="El email ya está registrado")
5. FastAPI returns 409 Conflict
6. Frontend catches error, displays "Email already registered"
7. User retries with different email
```

## Security Considerations

### Password Hashing

- **Algorithm**: bcrypt (Passlib library handles it)
- **Cost Factor**: ≥ 10 (default 12 recommended for security)
- **Salt**: Automatically generated per password
- **Verification**: Use `passlib.context.CryptContext.verify()`, never compare raw strings

### Token Security

- **Access Token**: Contains claims, signed with HS256, expires in 30 min
- **Refresh Token**: Opaque UUID, stored in DB with expiration
- **HTTPS**: All endpoints must use HTTPS in production (env config)
- **CORS**: Only http://localhost:5173 in dev (env config)

### Input Validation

- Email format validated by Pydantic EmailStr
- Password length enforced (min 8)
- Nombre, telefono trimmed and length-checked
- All fields escaped by Pydantic (XSS prevention)

### Error Messages

- Email already registered → return 409 (don't say why)
- Invalid request → return 400 with detailed field errors
- Server error → return 500 (no stack trace exposed)

## Testing Strategy

### Backend Unit Tests

```python
# test_auth_service.py
async def test_register_creates_user_with_client_role():
    ...

async def test_register_hashes_password_with_bcrypt():
    ...

async def test_register_rejects_duplicate_email():
    ...

async def test_register_returns_valid_tokens():
    ...
```

### Backend Integration Tests

```python
# test_auth_router.py
async def test_post_register_201_on_success():
    ...

async def test_post_register_409_on_duplicate_email():
    ...

async def test_post_register_400_on_invalid_email():
    ...
```

### Frontend Unit Tests

```typescript
// RegisterForm.test.tsx
it('submits form with valid data', async () => {
  ...
});

it('displays error on email conflict', async () => {
  ...
});

it('updates authStore on success', () => {
  ...
});
```

## Deployment Considerations

- Ensure `DATABASE_URL` points to PostgreSQL ≥ 12
- Ensure `SECRET_KEY` is ≥ 64 random characters (generated once, not changed)
- Ensure bcrypt cost factor matches performance requirements (10 minimum, 12 default)
- Monitor password hashing duration (should be <100ms on target hardware)
