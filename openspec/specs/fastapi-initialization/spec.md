# Spec: fastapi-initialization

## Overview
Este spec define la inicialización mínima pero completa de la aplicación FastAPI: estructura base, middleware (CORS), documentación OpenAPI, dependency injection setup, manejo de errores, y logging.

## Requirements

### REQ-001: App FastAPI inicializa con título y versión
La app DEBE tener título="Food Store API" y version="1.0.0" especificados en FastAPI().

**Scenario: Documentación Swagger está disponible**
- Given: Backend iniciado con `uvicorn app.main:app --reload`
- When: Se accede a http://localhost:8000/docs
- Then: Swagger UI muestra "Food Store API v1.0.0"

### REQ-002: CORS configurado correctamente
FastAPI DEBE tener CORSMiddleware configurado para permitir requests desde `http://localhost:5173` (frontend) y `http://localhost:3000` (potencial). No debe permitir `*` en producción.

**Scenario: Frontend puede hacer requests a backend**
- Given: Backend ejecutando en 8000, frontend en 5173
- When: Frontend ejecuta `fetch('http://localhost:8000/api/v1/productos')`
- Then: Request no es bloqueado por CORS (Access-Control-Allow-Origin contiene 5173)

### REQ-003: Rutas versionadas con prefijo /api/v1
Todos los routers DEBEN estar registrados bajo el prefijo `/api/v1`. Ningún endpoint puede vivir sin este prefijo.

**Scenario: Endpoints están bajo /api/v1**
- Given: Backend iniciado
- When: Se accede a http://localhost:8000/docs
- Then: Todos los endpoints comienzan con `/api/v1`

### REQ-004: Manejo de excepciones global con RFC 7807
La app DEBE tener exception handler global que convierta cualquier excepción no esperada en respuesta JSON RFC 7807: `{"detail": "...", "status": 500, "type": "..."}`

**Scenario: Error no esperado devuelve RFC 7807**
- Given: Backend iniciado
- When: Se dispara un endpoint que lanza excepción no manejada
- Then: Respuesta HTTP 500 con JSON `{"detail": "Internal Server Error", "status": 500, "type": "..."}`

### REQ-005: Request logging
La app DEBE loguear cada request: timestamp, método HTTP, path, status code, duration.

**Scenario: Logs muestran actividad**
- Given: Backend iniciado con logging en level INFO
- When: Se ejecuta `GET /api/v1/productos`
- Then: Aparece en logs: `2026-04-22 10:00:00 - GET /api/v1/productos - 200 - 45ms`

### REQ-006: Health check endpoint
DEBE existir `GET /health` (sin /api/v1) que retorne `{"status": "ok"}` con HTTP 200.

**Scenario: Health check está disponible**
- Given: Backend iniciado
- When: `curl http://localhost:8000/health`
- Then: Retorna 200 con `{"status": "ok"}`

### REQ-007: Dependency injection setup
FastAPI DEBE tener dependency injection para `get_db()` (sesión de BD), `get_current_user()` (usuario autenticado), `require_role(roles: List[str])` (validación de roles).

**Scenario: Dependency injection es usable**
- Given: Backend iniciado
- When: Se define endpoint `async def crear_producto(service: ProductoService = Depends(get_uow))`
- Then: El endpoint recibe el servicio inyectado sin levantar errores

## Output Files

- `backend/app/main.py` — inicialización FastAPI
- `backend/app/config.py` — configuración de CORS y entorno
- `backend/app/middleware.py` — logging y exception handlers
- `backend/app/dependencies.py` — inyección de dependencias
