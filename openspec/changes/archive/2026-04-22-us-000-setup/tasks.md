# Tasks: us-000-setup

## Phase 1: Backend Structure & Configuration

- [x] 1.1 Crear estructura base de carpetas backend: `app/`, `app/db/`, `app/core/`, `app/modules/`
- [x] 1.2 Crear `backend/.env.example` con variables: DATABASE_URL, SECRET_KEY, ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS, MP_ACCESS_TOKEN, MP_PUBLIC_KEY, CORS_ORIGINS
- [x] 1.3 Crear `requirements.txt` con: fastapi, sqlmodel, sqlalchemy, alembic, psycopg2-binary, bcrypt, passlib, python-jose, slowapi, mercadopago, pydantic, pydantic-settings, python-multipart
- [x] 1.4 Crear `backend/pyproject.toml` o `.python-version` para especificar Python 3.11+
- [x] 1.5 Crear `backend/.gitignore` (venv, __pycache__, .env, *.pyc)

## Phase 2: FastAPI Initialization

- [x] 2.1 Crear `app/main.py` con FastAPI() instancia, título, versión, description
- [x] 2.2 Crear `app/config.py` con BaseSettings, parseo de variables de entorno, CORS_ORIGINS parsing
- [x] 2.3 Crear `app/middleware.py` con CORSMiddleware para localhost:5173 y :3000
- [x] 2.4 Crear `app/middleware.py` con logger middleware que loguee: timestamp, method, path, status_code, duration
- [x] 2.5 Crear `app/middleware.py` con exception handler global que retorne RFC 7807
- [x] 2.6 Crear `app/dependencies.py` con funciones: get_db() (sesión BD), get_current_user() (stub), require_role() (stub)
- [x] 2.7 Añadir ruta `GET /health` en main.py que retorna {"status": "ok"}
- [x] 2.8 Crear `app/__main__.py` con script que ejecute uvicorn (entry point para `python -m app`)

## Phase 3: Database Setup & Models

- [x] 3.1 Crear `app/db/session.py` con engine, SessionLocal usando sqlmodel.create_engine
- [x] 3.2 Crear `app/db/base.py` con SQLModel base class y métodos comunes (created_at, updated_at, deleted_at)
- [x] 3.3 Crear `app/models/` con archivos por dominio: usuario.py, categoria.py, producto.py, pedido.py, pago.py
- [x] 3.4 En usuario.py: Usuario (id, nombre, email UQ, password_hash, telefono, created_at, updated_at, deleted_at)
- [x] 3.5 En usuario.py: Rol (codigo PK, nombre, descripcion), UsuarioRol (usuario_id, rol_codigo, PK compuesta), RefreshToken, DireccionEntrega
- [x] 3.6 En categoria.py: Categoria (id, nombre, description, imagen, padre_id self-ref)
- [x] 3.7 En producto.py: Producto (id, nombre, descripcion, imagen, precio_base, stock_cantidad, disponible, created_at, updated_at, deleted_at)
- [x] 3.8 En producto.py: Ingrediente (id, nombre, es_alergeno), ProductoCategoria (N:M), ProductoIngrediente (N:M con es_removible)
- [x] 3.9 En producto.py: FormaPago (codigo PK, nombre, habilitado)
- [x] 3.10 En pedido.py: EstadoPedido (codigo PK, nombre, es_terminal), Pedido, DetallePedido, HistorialEstadoPedido, Pago
- [x] 3.11 Crear índices en: usuario.email, refresh_token.usuario_id, producto.disponible, pedido.usuario_id, pedido.estado_codigo

## Phase 4: Alembic Migrations

- [x] 4.1 Crear `backend/alembic.ini` con configuración base
- [x] 4.2 Crear estructura `app/db/migrations/` con env.py, script.py.mako
- [x] 4.3 Generar migración inicial: `alembic revision --autogenerate -m "Initial schema"`
- [x] 4.4 Verificar que migración contiene todas las tablas y relaciones
- [x] 4.5 Crear script para aplicar migraciones: `alembic upgrade head` documentado en CONTRIBUTING.md

## Phase 5: Database Seeding

- [x] 5.1 Crear `app/db/seed.py` con función `seed_database()`
- [x] 5.2 En seed.py: Crear 4 roles (ADMIN, STOCK, PEDIDOS, CLIENT) con descripciones
- [x] 5.3 En seed.py: Crear 6 estados (PENDIENTE, CONFIRMADO, EN_PREP, EN_CAMINO, ENTREGADO, CANCELADO)
- [x] 5.4 En seed.py: Crear 3 formas de pago (MERCADOPAGO, EFECTIVO, TRANSFERENCIA)
- [x] 5.5 En seed.py: Crear usuario admin (email=admin@foodstore.local, password=admin123 hasheado)
- [x] 5.6 Hacer seed.py idempotente: verificar existencia antes de insertar
- [x] 5.7 Crear `app/__main__.py` con `if __name__ == "__main__": seed_database()` para ejecutar con `python -m app.db.seed`

## Phase 6: Frontend Structure & Configuration

- [x] 6.1 Crear estructura FSD: shared/, entities/, features/, widgets/, pages/, app/
- [x] 6.2 Crear `frontend/vite.config.ts` con React plugin, alias @, minification
- [x] 6.3 Crear `frontend/tsconfig.json` con strict: true, es2020, jsx: react-jsx, paths alias
- [x] 6.4 Crear `frontend/package.json` con scripts: dev, build, preview, type-check
- [x] 6.5 Crear `frontend/.env.example` con VITE_API_URL=http://localhost:8000, VITE_MP_PUBLIC_KEY
- [x] 6.6 Crear `frontend/.gitignore` (node_modules, dist, .env, etc)

## Phase 7: Frontend Libraries & Configuration

- [x] 7.1 Crear `frontend/tailwind.config.js` con tema por defecto, content paths
- [x] 7.2 Crear `frontend/postcss.config.js` con tailwind y autoprefixer
- [x] 7.3 Crear `frontend/src/app/index.css` con `@tailwind` directives
- [x] 7.4 Crear `frontend/src/shared/api/client.ts` con Axios singleton, interceptores stub
- [x] 7.5 Crear `frontend/src/features/auth/store/authStore.ts` con Zustand, persistencia localStorage

## Phase 8: Frontend Routing & App Setup

- [x] 8.1 Crear `frontend/src/app/router.tsx` con React Router v6 setup
- [x] 8.2 En router.tsx: Definir rutas: /, /login, /dashboard, /404 (sin componentes, solo stubs)
- [x] 8.3 Crear `frontend/src/app/queryClient.ts` con QueryClient configurado
- [x] 8.4 Crear `frontend/src/app/App.tsx` con QueryClientProvider, RouterProvider, themes
- [x] 8.5 Crear `frontend/src/index.tsx` con ReactDOM.createRoot() y renderizado de App

## Phase 9: Documentation

- [x] 9.1 Crear `CONTRIBUTING.md` con: requerimientos (Python 3.11+, Node 18+, PostgreSQL 15+), versiones de CLI
- [x] 9.2 En CONTRIBUTING.md: Step-by-step backend setup (venv, pip install, .env, alembic upgrade, seed)
- [x] 9.3 En CONTRIBUTING.md: Step-by-step frontend setup (npm install, .env, npm run dev)
- [x] 9.4 En CONTRIBUTING.md: Cómo correr ambos localmente (tmux, separate terminals)
- [x] 9.5 En CONTRIBUTING.md: Convenciones de commits (feat, fix, refactor, docs, test)
- [x] 9.6 En CONTRIBUTING.md: Branch naming (feature/us-000-setup, bugfix/issue-123)
- [x] 9.7 Actualizar `README.md` con link a CONTRIBUTING.md como primer paso

## Phase 10: Verification & Git

- [x] 10.1 Ejecutar `python -m app` y verificar que http://localhost:8000/health retorna 200
- [x] 10.2 Ejecutar `python -m app.db.seed` y verificar que no hay errores de integridad
- [x] 10.3 En PostgreSQL, ejecutar queries para verificar tablas existen (SELECT * FROM usuario, etc)
- [x] 10.4 Ejecutar `npm run dev` en frontend y verificar que localhost:5173 carga sin errores
- [x] 10.5 Verificar CORS: desde browser en 5173, ejecutar fetch a http://localhost:8000/health
- [x] 10.6 Verificar que tanto backend como frontend se pueden clonar y ejecutar desde cero
- [x] 10.7 Hacer commit: `feat(setup): Initialize FastAPI, PostgreSQL, React with FSD`
- [x] 10.8 Crear tag: `sprint-0-complete`
