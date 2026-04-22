# FoodStore Backend API

FastAPI-based REST API for the FoodStore e-commerce platform.

## Requirements

- Python 3.11+
- PostgreSQL 15+
- pip

## Installation

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your configuration
```

## Configuration

Copy `.env.example` to `.env` and configure:

```env
# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost/foodstore_db

# JWT
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Server
API_V1_STR=/api/v1
```

## Running the Server

```bash
# Development (with auto-reload)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

Server will be available at `http://localhost:8000`

API docs: `http://localhost:8000/docs` (Swagger UI)

## Database

### Migrations

```bash
# Create migration
alembic revision --autogenerate -m "Migration message"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

### Seed Data

```bash
# Run seed script to populate initial data (roles, etc)
python -m app.db.seed
```

## API Endpoints

### Authentication

#### Register User
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "nombre": "Juan",
  "email": "juan@example.com",
  "password": "SecurePass123!",
  "numero_telefono": "+5491123456789"  // optional
}
```

**Responses:**
- **201 Created**: Registration successful
  ```json
  {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh_token": "550e8400-e29b-41d4-a716-446655440000",
    "token_type": "Bearer",
    "user": {
      "id": 1,
      "nombre": "Juan",
      "email": "juan@example.com",
      "numero_telefono": "+5491123456789",
      "roles": ["customer"],
      "creado_en": "2026-04-22T10:30:00Z",
      "actualizado_en": "2026-04-22T10:30:00Z"
    }
  }
  ```

- **400 Bad Request**: Validation error
  ```json
  {
    "detail": "Validation error message"
  }
  ```

- **409 Conflict**: Email already registered
  ```json
  {
    "detail": "El email ya está registrado"
  }
  ```

#### Login (Coming soon - US-002)
```http
POST /api/v1/auth/login
```

#### Refresh Token (Coming soon - US-003)
```http
POST /api/v1/auth/refresh
```

#### Logout (Coming soon - US-004)
```http
POST /api/v1/auth/logout
```

## Project Structure

```
backend/
├── app/
│   ├── core/
│   │   ├── config.py          # Settings and configuration
│   │   └── dependencies.py    # FastAPI dependencies
│   ├── db/
│   │   ├── base.py           # Base model mixin
│   │   ├── models/
│   │   │   └── usuario.py    # User, Role, RefreshToken models
│   │   ├── repository.py     # Generic CRUD repository
│   │   └── session.py        # Database session factory
│   ├── modules/
│   │   └── auth/
│   │       ├── router.py     # Auth endpoints
│   │       ├── service.py    # Business logic (hashing, tokens)
│   │       └── schemas.py    # Request/response models
│   └── main.py               # FastAPI app initialization
├── tests/
│   ├── test_auth_service.py  # Unit tests for AuthService
│   └── test_auth_router.py   # Integration tests for routes
├── migrations/
│   └── versions/             # Alembic migration files
├── requirements.txt
├── .env.example
└── README.md
```

## Authentication

### JWT Tokens

**Access Token** (JWT HS256, 30 minutes):
- Payload includes: `user_id`, `email`, `roles`
- Used for API requests in `Authorization: Bearer <token>` header

**Refresh Token** (UUID v4, 7 days):
- Stored in database
- Used to obtain new access tokens
- Can be revoked

### Password Security

- Passwords hashed with **bcrypt** (cost factor ≥ 10)
- Never stored in plain text
- Verified using `passlib.context.CryptContext`

## Testing

### Unit Tests
```bash
pytest app/tests/test_auth_service.py -v
```

Tests password hashing, token creation, token validation (with mocks, no DB needed).

### Integration Tests
```bash
pytest app/tests/test_auth_router.py -v
```

Tests endpoint validation, error handling, request/response schemas.

### Run All Tests
```bash
pytest app/tests/ -v --cov=app
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "detail": "Error description"
}
```

HTTP Status Codes:
- `200 OK` - Success
- `201 Created` - Resource created successfully
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Missing or invalid auth token
- `409 Conflict` - Duplicate email
- `500 Internal Server Error` - Server error

## Development

### Docker (Development)

Para levantar el backend junto con el frontend y la base de datos usando Docker:

```bash
# Desde la raíz del proyecto
docker-compose up -d
```

Esto levantará los servicios en `http://localhost:8000` (backend) y `http://localhost:5173` (frontend). La base de datos estará disponible en `localhost:5433`.

### Code Style

- Use **FastAPI async patterns** (async/await)
- Use **SQLModel** for ORM models
- Follow **Pydantic v2** patterns for validation
- Use **dependency injection** with `Depends()`

### Adding New Endpoints

1. Create schema in `modules/<feature>/schemas.py`
2. Add business logic in `modules/<feature>/service.py`
3. Create routes in `modules/<feature>/router.py`
4. Register router in `app/main.py`

## Documentation

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## License

Internal use only.
