# Tasks: us-000-setup

## Phase 1: Backend Structure & Configuration

- [ ] 1.1 Crear estructura base de carpetas backend: `app/`, `app/db/`, `app/core/`, `app/modules/`
- [ ] 1.2 Crear `backend/.env.example` con variables: DATABASE_URL, SECRET_KEY, ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS, MP_ACCESS_TOKEN, MP_PUBLIC_KEY, CORS_ORIGINS
- [ ] 1.3 Crear `requirements.txt` con: fastapi, sqlmodel, sqlalchemy, alembic, psycopg2-binary, bcrypt, passlib, python-jose, slowapi, mercadopago, pydantic, pydantic-settings, python-multipart
- [ ] 1.4 Crear `backend/pyproject.toml` o `.python-version` para especificar Python 3.11+
- [ ] 1.5 Crear `backend/.gitignore` (venv, __pycache__, .env, *.pyc)

## Phase 2: FastAPI Initialization

- [ ] 2.1 Crear `app/main.py` con FastAPI() instancia, título, versión, description
- [ ] 2.2 Crear `app/config.py` con BaseSettings, parseo de variables de entorno, CORS_ORIGINS parsing
- [ ] 2.3 Crear `app/middleware.py` con CORSMiddleware para localhost:5173 y :3000
- [ ] 2.4 Crear `app/middleware.py` con logger middleware que loguee: timestamp, method, path, status_code, duration
- [ ] 2.5 Crear `app/middleware.py` con exception handler global que retorne RFC 7807
- [ ] 2.6 Crear `app/dependencies.py` con funciones: get_db() (sesión BD), get_current_user() (stub), require_role() (stub)
- [ ] 2.7 Añadir ruta `GET /health` en main.py que retorna {"status": "ok"}
- [ ] 2.8 Crear `app/__main__.py` con script que ejecute uvicorn (entry point para `python -m app`)

## Phase 3: Database Setup & Models

- [ ] 3.1 Crear `app/db/session.py` con engine, SessionLocal usando sqlmodel.create_engine
- [ ] 3.2 Crear `app/db/base.py` con SQLModel base class y métodos comunes (created_at, updated_at, deleted_at)
- [ ] 3.3 Crear `app/models/` con archivos por dominio: usuario.py, categoria.py, producto.py, pedido.py, pago.py
- [ ] 3.4 En usuario.py: Usuario (id, nombre, email UQ, password_hash, telefono, created_at, updated_at, deleted_at)
- [ ] 3.5 En usuario.py: Rol (codigo PK, nombre, descripcion), UsuarioRol (usuario_id, rol_codigo, PK compuesta), RefreshToken, DireccionEntrega
- [ ] 3.6 En categoria.py: Categoria (id, nombre, description, imagen, padre_id self-ref)
- [ ] 3.7 En producto.py: Producto (id, nombre, descripcion, imagen, precio_base, stock_cantidad, disponible, created_at, updated_at, deleted_at)
- [ ] 3.8 En producto.py: Ingrediente (id, nombre, es_alergeno), ProductoCategoria (N:M), ProductoIngrediente (N:M con es_removible)
- [ ] 3.9 En producto.py: FormaPago (codigo PK, nombre, habilitado)
- [ ] 3.10 En pedido.py: EstadoPedido (codigo PK, nombre, es_terminal), Pedido, DetallePedido, HistorialEstadoPedido, Pago
- [ ] 3.11 Crear índices en: usuario.email, refresh_token.usuario_id, producto.disponible, pedido.usuario_id, pedido.estado_codigo

## Phase 4: Alembic Migrations

- [ ] 4.1 Crear `backend/alembic.ini` con configuración base
- [ ] 4.2 Crear estructura `app/db/migrations/` con env.py, script.py.mako
- [ ] 4.3 Generar migración inicial: `alembic revision --autogenerate -m "Initial schema"`
- [ ] 4.4 Verificar que migración contiene todas las tablas y relaciones
- [ ] 4.5 Crear script para aplicar migraciones: `alembic upgrade head` documentado en CONTRIBUTING.md

## Phase 5: Database Seeding

- [ ] 5.1 Crear `app/db/seed.py` con función `seed_database()`
- [ ] 5.2 En seed.py: Crear 4 roles (ADMIN, STOCK, PEDIDOS, CLIENT) con descripciones
- [ ] 5.3 En seed.py: Crear 6 estados (PENDIENTE, CONFIRMADO, EN_PREP, EN_CAMINO, ENTREGADO, CANCELADO)
- [ ] 5.4 En seed.py: Crear 3 formas de pago (MERCADOPAGO, EFECTIVO, TRANSFERENCIA)
- [ ] 5.5 En seed.py: Crear usuario admin (email=admin@foodstore.local, password=admin123 hasheado)
- [ ] 5.6 Hacer seed.py idempotente: verificar existencia antes de insertar
- [ ] 5.7 Crear `app/__main__.py` con `if __name__ == "__main__": seed_database()` para ejecutar con `python -m app.db.seed`

## Phase 6: Frontend Structure & Configuration

- [ ] 6.1 Crear estructura FSD: shared/, entities/, features/, widgets/, pages/, app/
- [ ] 6.2 Crear `frontend/vite.config.ts` con React plugin, alias @, minification
- [ ] 6.3 Crear `frontend/tsconfig.json` con strict: true, es2020, jsx: react-jsx, paths alias
- [ ] 6.4 Crear `frontend/package.json` con scripts: dev, build, preview, type-check
- [ ] 6.5 Crear `frontend/.env.example` con VITE_API_URL=http://localhost:8000, VITE_MP_PUBLIC_KEY
- [ ] 6.6 Crear `frontend/.gitignore` (node_modules, dist, .env, etc)

## Phase 7: Frontend Libraries & Configuration

- [ ] 7.1 Crear `frontend/tailwind.config.js` con tema por defecto, content paths
- [ ] 7.2 Crear `frontend/postcss.config.js` con tailwind y autoprefixer
- [ ] 7.3 Crear `frontend/src/app/index.css` con `@tailwind` directives
- [ ] 7.4 Crear `frontend/src/shared/api/client.ts` con Axios singleton, interceptores stub
- [ ] 7.5 Crear `frontend/src/features/auth/store/authStore.ts` con Zustand, persistencia localStorage

## Phase 8: Frontend Routing & App Setup

- [ ] 8.1 Crear `frontend/src/app/router.tsx` con React Router v6 setup
- [ ] 8.2 En router.tsx: Definir rutas: /, /login, /dashboard, /404 (sin componentes, solo stubs)
- [ ] 8.3 Crear `frontend/src/app/queryClient.ts` con QueryClient configurado
- [ ] 8.4 Crear `frontend/src/app/App.tsx` con QueryClientProvider, RouterProvider, themes
- [ ] 8.5 Crear `frontend/src/index.tsx` con ReactDOM.createRoot() y renderizado de App

## Phase 9: Documentation

- [ ] 9.1 Crear `CONTRIBUTING.md` con: requerimientos (Python 3.11+, Node 18+, PostgreSQL 15+), versiones de CLI
- [ ] 9.2 En CONTRIBUTING.md: Step-by-step backend setup (venv, pip install, .env, alembic upgrade, seed)
- [ ] 9.3 En CONTRIBUTING.md: Step-by-step frontend setup (npm install, .env, npm run dev)
- [ ] 9.4 En CONTRIBUTING.md: Cómo correr ambos localmente (tmux, separate terminals)
- [ ] 9.5 En CONTRIBUTING.md: Convenciones de commits (feat, fix, refactor, docs, test)
- [ ] 9.6 En CONTRIBUTING.md: Branch naming (feature/us-000-setup, bugfix/issue-123)
- [ ] 9.7 Actualizar `README.md` con link a CONTRIBUTING.md como primer paso

## Phase 10: Verification & Git

- [ ] 10.1 Ejecutar `python -m app` y verificar que http://localhost:8000/health retorna 200
- [ ] 10.2 Ejecutar `python -m app.db.seed` y verificar que no hay errores de integridad
- [ ] 10.3 En PostgreSQL, ejecutar queries para verificar tablas existen (SELECT * FROM usuario, etc)
- [ ] 10.4 Ejecutar `npm run dev` en frontend y verificar que localhost:5173 carga sin errores
- [ ] 10.5 Verificar CORS: desde browser en 5173, ejecutar fetch a http://localhost:8000/health
- [ ] 10.6 Verificar que tanto backend como frontend se pueden clonar y ejecutar desde cero
- [ ] 10.7 Hacer commit: `feat(setup): Initialize FastAPI, PostgreSQL, React with FSD`
- [ ] 10.8 Crear tag: `sprint-0-complete`
