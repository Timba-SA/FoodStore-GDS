# Design: us-000-setup

## Architecture Overview

Este es Sprint 0 — infraestructura pura. La arquitectura sigue dos pilares:

1. **Backend**: Arquitectura en capas con flujo de dependencia unidireccional (Router → Service → UoW → Repository → Model). Cada módulo es feature-first autocontenido. FastAPI + SQLModel + PostgreSQL.

2. **Frontend**: Feature-Sliced Design (FSD) con 6 capas (shared, entities, features, widgets, pages, app). Separación clara: Zustand para estado del cliente, TanStack Query para estado del servidor.

## Components

### Backend Structure

```
backend/
├── app/
│   ├── __main__.py              # Entry point: python -m app
│   ├── main.py                  # Inicialización FastAPI
│   ├── config.py                # Configuración (CORS, entorno)
│   ├── middleware.py            # Logging, exception handlers
│   ├── dependencies.py          # Inyección de dependencias
│   ├── db/
│   │   ├── __init__.py
│   │   ├── base.py              # Base clase para modelos SQLModel
│   │   ├── session.py           # SessionLocal, engine
│   │   ├── seed.py              # Carga de datos catalógicos
│   │   └── migrations/          # Alembic
│   │       └── versions/        # Migraciones .py
│   ├── core/
│   │   ├── uow.py               # Unit of Work pattern
│   │   ├── exceptions.py        # Excepciones custom
│   │   └── constants.py         # Enums (roles, estados, etc)
│   └── modules/
│       ├── auth/                # Módulo auth (futuro)
│       ├── usuarios/            # Módulo usuarios
│       ├── ...                  # Otros módulos
├── requirements.txt
├── .env.example
└── alembic.ini
```

### Frontend Structure (FSD)

```
frontend/
├── src/
│   ├── app/
│   │   ├── App.tsx              # Root component
│   │   ├── router.tsx           # React Router setup
│   │   ├── queryClient.ts       # TanStack Query
│   │   ├── index.css            # Tailwind + globals
│   │   └── index.tsx            # Entry point
│   ├── shared/                  # Capas reutilizables
│   │   ├── ui/                  # Botones, inputs, modals
│   │   ├── api/
│   │   │   └── client.ts        # Axios singleton con interceptores
│   │   ├── types/               # Tipos globales
│   │   ├── hooks/               # Hooks genéricos
│   │   └── index.ts
│   ├── entities/                # Modelos de dominio
│   │   ├── user/
│   │   ├── product/
│   │   └── index.ts
│   ├── features/                # Interacciones de usuario
│   │   ├── auth/
│   │   │   ├── store/           # Zustand authStore
│   │   │   ├── hooks/
│   │   │   ├── components/
│   │   │   └── index.ts
│   │   └── ...
│   ├── widgets/                 # Bloques compuestos
│   │   ├── navbar/
│   │   └── index.ts
│   ├── pages/                   # Páginas de la app
│   │   ├── HomePage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── NotFoundPage.tsx
│   │   └── index.ts
│   └── index.tsx
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── .env.example
└── package.json
```

## Data Model

### Inicialización de Base de Datos

La BD se crea mediante Alembic:

```bash
# Generar revisión inicial (en futuro, después de definir modelos)
alembic revision --autogenerate -m "Initial schema"

# Aplicar migraciones
alembic upgrade head

# Cargar datos catalógicos
python -m app.db.seed
```

El seed es idempotente: puede ejecutarse varias veces sin duplicados.

Tablas base creadas:
- **Identidad**: Usuario, Rol, UsuarioRol, RefreshToken, DireccionEntrega
- **Catálogo**: Categoria, Producto, Ingrediente, ProductoCategoria, ProductoIngrediente, FormaPago
- **Ventas**: EstadoPedido, Pedido, DetallePedido, HistorialEstadoPedido, Pago

## API Changes

### Endpoints en Sprint 0

- `GET /health` → Health check
- `GET /docs` → Swagger UI
- `GET /redoc` → ReDoc

Ningún endpoint de negocio se implementa en Sprint 0. Todos los módulos posteriores expondrán rutas bajo `/api/v1/<modulo>/`.

## Implementation Notes

### Backend Initialization

1. **FastAPI app** (`main.py`): Instancia FastAPI con título, versión, y debug mode.
2. **Middleware**: CORSMiddleware para localhost:5173 y localhost:3000, logging middleware, exception handlers.
3. **Dependency injection**: `get_db()`, `get_current_user()`, `require_role()` preparados pero sin lógica (auth viene después).
4. **Database session**: `SessionLocal` configurada con Pool size, echo logging.
5. **Routers registrados**: Vacíos por ahora, pero estructura lista (`app.include_router(router_auth, prefix="/api/v1/auth")`, etc).

### Frontend Initialization

1. **Vite**: Configurado con plugin React (@vitejs/plugin-react), minificación, sourcemaps.
2. **TypeScript**: strict mode, paths aliasing (`@` → `src/`).
3. **Tailwind**: Integrado con PostCSS, purging automático.
4. **Zustand authStore**: Persiste en localStorage bajo `auth_store`, inicialmente vacío.
5. **Axios client**: Singleton en `shared/api/client.ts` con interceptores stub (lógica real en sprint de auth).
6. **React Router**: Rutas básicas, outlet para layouts.

### No hacer en este sprint

- ❌ Endpoints de auth (es `us-001`)
- ❌ Lógica de negocio (es `us-002` y siguientes)
- ❌ UI compleja (solo scaffolding)
- ❌ Integración MercadoPago (es `us-006`)

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| PostgreSQL no está instalado localmente | CONTRIBUTING.md explica instalación por SO. Docker Compose opcional (fase 2). |
| Venv / npm install falla por versions conflictivas | requirements.txt y package.json fijan versiones exactas. Test en CI después. |
| Alembic migration falla por cambios en models futuros | Verificar que modelos sean consistentes con migration antes de apply. |
| CORS origin list es hardcodeado | Usar variable de entorno CORS_ORIGINS que se parsea como lista. |
| FSD layers se mezclan (imports incorrectos) | Configurar ESLint con plugin `eslint-plugin-import` para forzar límites. |
