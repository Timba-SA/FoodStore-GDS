# Mapa de Changes — Food Store v5.0

**Proyecto:** Food Store E-Commerce  
**Metodología:** Spec-Driven Development (SDD) con OPSX  
**Stack:** React + TypeScript + FastAPI + PostgreSQL  
**Última actualización:** 2026-04-22

---

## Resumen Ejecutivo

Este documento define el **mapa completo de changes** para desarrollar Food Store desde cero hasta producción. Cada change es una unidad mínima de trabajo que abarca una funcionalidad o dominio completo, con sus propios artefactos (proposal, design, tasks).

El flujo se organiza en **13 changes** distribuidos en 7 épicas temáticas, respetando dependencias estrictas. **NO implementes ningún change sin tener aprobados su proposal y design.**

---

## Guía de Lectura

Cada change está documentado con este formato:

```
## change-name (nombre-kebab-case)

### Metadata
- **ID**: [Sequential ID para referencia]
- **Épica**: [Epic que contiene este change]
- **Prioridad**: [Alta / Media / Baja]
- **Esfuerzo estimado**: [1-5 semanas]

### Descripción
[Qué se construye en este change — narrativa corta]

### Historias de Usuario (HUs) Cubiertas
- US-XXX: Título
- US-XXX: Título

### Dependencias
- change-Y (razón de la dependencia)
- change-Z (razón de la dependencia)

### Funcionalidades Clave
- [Feature 1]
- [Feature 2]
- [Feature 3]

### Criterios de Aceptación Resumidos
- [ ] Criterio 1
- [ ] Criterio 2

### Reglas de Negocio (RN) Relevantes
- RN-AU01, RN-AU02, RN-DA01

### Notas Técnicas
[Detalles arquitectónicos, patrones, gotchas]
```

---

# ÉPICA 00 — Infraestructura y Setup

## 00-scaffold-monorepo

### Metadata
- **ID**: 00-scaffold-monorepo
- **Épica**: ÉPICA 00 — Infraestructura y Setup
- **Prioridad**: Alta
- **Esfuerzo estimado**: 1 semana

### Descripción
Scaffolding completo del monorepo con estructura de directorios, configuración inicial de Git, y setup de ambientes (backend feature-first, frontend FSD).

### Historias de Usuario Cubiertas
- US-000: Inicialización del repositorio y estructura del proyecto

### Dependencias
- Ninguna (es el punto de partida)

### Funcionalidades Clave
- Estructura de carpetas backend: `backend/app/modules/{auth,usuarios,productos,pedidos,pagos,direcciones,categorias,admin}`
- Estructura de carpetas frontend: `frontend/src/{app,pages,features,entities,shared}`
- `.gitignore` completo (`.env`, `__pycache__`, `node_modules`, `.venv`, `dist`)
- `.env.example` en backend y frontend con variables documentadas
- `README.md` raíz con instrucciones de setup
- Convenios de commits (Conventional Commits)
- Inicialización de git con commits progresivos

### Criterios de Aceptación Resumidos
- [ ] Repositorio Git con estructura monorepo clara
- [ ] `.gitignore` excluye archivos sensibles
- [ ] README.md con instrucciones básicas funcionando
- [ ] Historial de Git muestra commits atómicos progresivos

### Reglas de Negocio Relevantes
- RN-DA01: Campos de auditoría en todas las tablas
- RN-AU10: `.env` nunca se commitea

### Notas Técnicas
- Usar tree o lista visual clara de directorios
- No incluir todavía dependencias npm/pip — solo estructura
- Commits iniciales: 1) estructura backend, 2) estructura frontend, 3) docs y gitignore

---

## 00-backend-fastapi-setup

### Metadata
- **ID**: 00-backend-fastapi-setup
- **Épica**: ÉPICA 00 — Infraestructura y Setup
- **Prioridad**: Alta
- **Esfuerzo estimado**: 1 semana

### Descripción
Instalación y configuración completa del backend con FastAPI, SQLModel, Alembic, dependencias de seguridad (Passlib, python-jose) y middlewares base (CORS, rate limiting, error handlers RFC 7807).

### Historias de Usuario Cubiertas
- US-000a: Configuración del entorno backend (FastAPI + dependencias)
- US-000d: Implementación de patrones base (BaseRepository, Unit of Work, dependencias FastAPI)

### Dependencias
- 00-scaffold-monorepo (estructura de carpetas debe existir)

### Funcionalidades Clave
- `main.py` con app FastAPI configurada
- CORSMiddleware habilitado para `http://localhost:5173`
- Middleware de rate limiting (slowapi)
- Middleware global de manejo de errores (RFC 7807)
- `core/config.py`: lectura de variables de entorno con defaults
- `core/database.py`: engine y session factory de SQLAlchemy
- `core/security.py`: funciones de hashing bcrypt y JWT
- `BaseRepository[T]` genérico con métodos CRUD comunes
- `UnitOfWork` como context manager (`async with`)
- Dependencias FastAPI: `get_current_user`, `require_role()`

### Criterios de Aceptación Resumidos
- [ ] `pip install -r requirements.txt` sin errores
- [ ] `uvicorn app.main:app --reload` arranca en puerto 8000
- [ ] Swagger UI accesible en `/docs`
- [ ] CORS permite `http://localhost:5173`
- [ ] BaseRepository[T] implementado con métodos: get_by_id, list_all, count, create, update, soft_delete, hard_delete
- [ ] UnitOfWork como context manager con commit/rollback automático
- [ ] `get_current_user` extrae y valida JWT
- [ ] `require_role()` verifica roles y lanza 403

### Reglas de Negocio Relevantes
- RN-AU02: JWT access token de 30 minutos con HS256
- RN-AU06: Rate limiting 5 intentos/15 min
- RN-DA08: Errores con RFC 7807

### Notas Técnicas
- `requirements.txt` incluye: fastapi, uvicorn, sqlmodel, alembic, passlib[bcrypt], python-jose, slowapi, mercadopago, pydantic[email-validator], httpx, psycopg2-binary
- `config.py` usa `BaseSettings` (Pydantic)
- Security: HS256 con SECRET_KEY >= 32 caracteres
- BaseRepository: usar TypeVar para genericidad
- UnitOfWork: `__aenter__` abre sesión, `__aexit__` commit/rollback

---

## 00-postgres-migrations-seed

### Metadata
- **ID**: 00-postgres-migrations-seed
- **Épica**: ÉPICA 00 — Infraestructura y Setup
- **Prioridad**: Alta
- **Esfuerzo estimado**: 1-2 semanas

### Descripción
Configuración de PostgreSQL, creación de todas las tablas mediante Alembic (migraciones), e implementación del script seed que carga datos iniciales (roles, estados de pedido, formas de pago, usuario admin).

### Historias de Usuario Cubiertas
- US-000b: Configuración de PostgreSQL, migraciones y seed data

### Dependencias
- 00-backend-fastapi-setup (config de conexión debe estar lista)

### Funcionalidades Clave
- Modelos SQLModel para las 16 tablas del ERD v5:
  - Dominio 1 (Identidad): Usuario, Rol, UsuarioRol, RefreshToken, DireccionEntrega
  - Dominio 2 (Catálogo): Categoria, Producto, Ingrediente, ProductoCategoria, ProductoIngrediente, FormaPago
  - Dominio 3 (Ventas): EstadoPedido, Pedido, DetallePedido, HistorialEstadoPedido, Pago
- Alembic con autogenerate: `alembic init alembic`, `alembic revision --autogenerate`
- Migraciones reversibles: `alembic downgrade -1` sin errores
- Script seed (`scripts/seed.py`) que carga:
  - 4 Roles: ADMIN (id=1), STOCK (id=2), PEDIDOS (id=3), CLIENT (id=4)
  - 6 EstadoPedido: PENDIENTE (1), CONFIRMADO (2), EN_PREP (3), EN_CAMINO (4), ENTREGADO (5), CANCELADO (6)
  - 3 FormaPago: MERCADOPAGO, EFECTIVO, TRANSFERENCIA (todas habilitadas)
  - 1 Usuario admin: admin@foodstore.com / Admin1234! (configurable por env vars)
- Idempotencia: ejecutar seed múltiples veces no duplica datos (INSERT ... ON CONFLICT DO NOTHING)

### Criterios de Aceptación Resumidos
- [ ] `alembic upgrade head` crea todas las 16 tablas sin errores
- [ ] Todas las tablas tienen campos de auditoría: `creado_en`, `actualizado_en`
- [ ] Soft delete implementado con `eliminado_en` (nullable timestamp)
- [ ] Constraints: UNIQUE en email, FK autorefencial en Categoria, M2M en UsuarioRol
- [ ] `python -m scripts.seed` carga 4 roles, 6 estados, 3 formas pago, 1 usuario admin
- [ ] Ejecutar seed 2 veces no duplica datos (idempotencia)
- [ ] `alembic downgrade -1` revierte sin errores

### Reglas de Negocio Relevantes
- RN-DA01: Campos `creado_en` y `actualizado_en` con defaults NOW()
- RN-DA02: IDs de seed estables (ADMIN=1, STOCK=2, PEDIDOS=3, CLIENT=4)
- RN-DA03: Script seed idempotente
- RN-CA04: Precio como NUMERIC de precisión fija, no float
- RN-CA05: Stock como INTEGER >= 0

### Notas Técnicas
- Modelos en `app/modules/{modulo}/model.py`, uno por dominio
- Alembic config: `sqlalchemy.url` desde variable de entorno
- RefreshToken: token_hash como CHAR(64) SHA-256
- Categoria: `parent_id` FK self-referencing, nullable
- Producto: `precio_base` DECIMAL(10,2), `stock_cantidad` INTEGER, `disponible` BOOLEAN
- HistorialEstadoPedido: append-only (nunca UPDATE/DELETE)
- Pago: incluir `idempotency_key` UUID único

---

## 00-frontend-vite-setup

### Metadata
- **ID**: 00-frontend-vite-setup
- **Épica**: ÉPICA 00 — Infraestructura y Setup
- **Prioridad**: Alta
- **Esfuerzo estimado**: 1 semana

### Descripción
Setup completo del frontend con React, TypeScript, Vite, Tailwind CSS, TanStack Query, TanStack Form, Axios configurado con interceptores JWT, y estructura FSD base.

### Historias de Usuario Cubiertas
- US-000c: Configuración del entorno frontend (React + Vite + dependencias)

### Dependencias
- 00-scaffold-monorepo (estructura debe existir)
- 00-backend-fastapi-setup (backend debe estar corriendo para verificar CORS)

### Funcionalidades Clave
- `npm create vite@latest frontend -- --template react-ts`
- `tsconfig.json` con `strict: true`, sin `any`
- Tailwind CSS v3+ integrado con PostCSS
- `src/shared/api/axios.ts`: instancia Axios centralizada con:
  - Base URL desde `VITE_API_BASE_URL`
  - Interceptor request: adjunta Authorization header con token
  - Interceptor response: ante 401, intenta refresh automático, actualiza store, reintenta request original
- `src/shared/stores/`: estructura para stores Zustand
- `src/shared/types/`: tipos TypeScript globales
- `src/shared/config/`: configuración (constantes, defaults)
- React Router DOM para routing (rutas públicas y privadas)
- QueryClientProvider en App root con defaults razonables
- `.env.example` con: `VITE_API_BASE_URL`, `VITE_MERCADOPAGO_PUBLIC_KEY`

### Criterios de Aceptación Resumidos
- [ ] `npm install` sin errores
- [ ] `npm run dev` arranca servidor en puerto 5173
- [ ] `npm run build` genera dist sin errores
- [ ] TypeScript `strict: true` sin warnings
- [ ] Tailwind CSS funciona en componentes
- [ ] Axios instancia centralizada con interceptores
- [ ] QueryClientProvider envuelve App
- [ ] `.env.example` documentado

### Reglas de Negocio Relevantes
- RN-AU02: Access token de 30 min, refresh de 7 días

### Notas Técnicas
- Vite config: plugin React + SWC para fast refresh
- Axios: configurar retrying lógica en interceptor (máximo 1 retry en 401)
- QueryClient config: staleTime 1min, cacheTime 5min, retry true, refetchOnWindowFocus true
- Router: Layout con Outlet, ProtectedRoute HOC
- Estructura carpetas: `app/`, `pages/`, `features/`, `entities/`, `shared/`

---

## 00-zustand-stores-setup

### Metadata
- **ID**: 00-zustand-stores-setup
- **Épica**: ÉPICA 00 — Infraestructura y Setup
- **Prioridad**: Alta
- **Esfuerzo estimado**: 1 semana

### Descripción
Implementación de los cuatro stores Zustand base (authStore, cartStore, paymentStore, uiStore) con persistencia selectiva en localStorage, tipado TypeScript estricto, y suscripción por slice.

### Historias de Usuario Cubiertas
- US-000e: Configuración de los stores de Zustand (authStore, cartStore, paymentStore, uiStore)

### Dependencias
- 00-frontend-vite-setup (Zustand debe estar instalado)
- 00-backend-fastapi-setup (endpoints de auth deben existir)

### Funcionalidades Clave
- **authStore** (`src/shared/stores/authStore.ts`):
  - Estado: `accessToken`, `refreshToken`, `user` (id, nombre, email, roles), `isAuthenticated`
  - Acciones: `login(tokens, user)`, `logout()`, `updateTokens(tokens)`
  - Selectores: `isAuthenticated()`, `hasRole(role)`
  - Persistencia: localStorage clave `food-store-auth` (solo `accessToken`)
  
- **cartStore** (`src/shared/stores/cartStore.ts`):
  - Estado: `items` (array de CartItem: {productoId, producto, cantidad, personalizacion})
  - Acciones: `addItem()`, `removeItem()`, `updateQuantity()`, `clearCart()`
  - Selectores: `totalItems()`, `totalPrice()`, `getItem()`
  - Persistencia: localStorage clave `food-store-cart` (items completos)
  
- **paymentStore** (`src/shared/stores/paymentStore.ts`):
  - Estado: `checkoutStep`, `preferenceId`, `paymentStatus`, `error`
  - Acciones: `startCheckout()`, `setPreference()`, `updatePaymentStatus()`, `resetPayment()`
  - SIN persistencia (transitorio)
  
- **uiStore** (`src/shared/stores/uiStore.ts`):
  - Estado: `theme` (light/dark), `sidebarOpen`, `toasts`
  - Persistencia: solo `theme`

### Criterios de Aceptación Resumidos
- [ ] 4 stores implementados en `src/shared/stores/`
- [ ] authStore con persistencia de accessToken
- [ ] cartStore con persistencia de items
- [ ] paymentStore sin persistencia
- [ ] Todos tipados con TypeScript (sin `any`)
- [ ] Suscripción por slice (selectores con callbacks)
- [ ] `useStore.getState()` funciona fuera de React (para interceptor Axios)

### Reglas de Negocio Relevantes
- RN-CR02: Carrito persiste al cerrar navegador y logout
- RN-CR01: Carrito es client-side only (Zustand + localStorage)

### Notas Técnicas
- Middleware `persist` de Zustand
- `partialize` para excluir campos de persistencia
- Tipos con interfaces TypeScript estrictos
- authStore: usar `getState()` en interceptor sin re-render
- cartStore: items con snapshots de producto y precios

---

# ÉPICA 01 — Autenticación y Autorización

## 01-auth-jwt-register-login

### Metadata
- **ID**: 01-auth-jwt-register-login
- **Épica**: ÉPICA 01 — Autenticación y Autorización
- **Prioridad**: Alta
- **Esfuerzo estimado**: 2 semanas

### Descripción
Implementación completa del flujo de autenticación: registro de usuarios, login con JWT (access + refresh tokens), refresh de tokens con rotación, logout con invalidación de tokens, y rate limiting en login.

### Historias de Usuario Cubiertas
- US-001: Registro de cliente
- US-002: Login de usuario
- US-003: Refresh de token
- US-004: Logout
- US-073: Rate limiting en endpoints sensibles

### Dependencias
- 00-backend-fastapi-setup (dependencias FastAPI implementadas)
- 00-postgres-migrations-seed (tablas Usuario, RefreshToken, Rol, UsuarioRol)
- 00-frontend-vite-setup (Axios configurado)
- 00-zustand-stores-setup (authStore implementado)

### Funcionalidades Clave
- **Backend**:
  - Endpoint `POST /api/v1/auth/register`: validar email único, hashear contraseña (bcrypt cost >= 12), asignar rol CLIENT automáticamente
  - Endpoint `POST /api/v1/auth/login`: validar credenciales, generar access + refresh tokens, rate limiting 5/15min
  - Endpoint `POST /api/v1/auth/refresh`: validar refresh token, rotar (revoque antiguo, emita nuevo), detección de replay attacks
  - Endpoint `POST /api/v1/auth/logout`: marcar refresh token como revocado
  - Dependencia `get_current_user`: extrae JWT, valida firma/expiracion, retorna Usuario
  - Dependencia `require_role()`: verifica roles, lanza 403 si insuficientes
  
- **Frontend**:
  - Formularios de login y registro con validación
  - Interceptor Axios que maneja 401 automáticamente (refresh + retry)
  - Persistencia de tokens en authStore
  - Redirección automática al login si sesión expira

### Criterios de Aceptación Resumidos
- [x] Registro valida email único, contraseña >= 8 chars
- [x] Contraseña hasheada con bcrypt (cost >= 12)
- [x] Login retorna access (30 min) + refresh (7 días) tokens
- [x] Rate limiting: 5 intentos fallidos/15 min → HTTP 429
- [x] Refresh token rota el anterior
- [x] Replay attack detectado → revoca TODOS los tokens del usuario
- [x] Logout invalida refresh token en BD
- [x] Interceptor maneja 401 automáticamente
- [x] Frontend persiste tokens en authStore

### Reglas de Negocio Relevantes
- RN-AU01: Contraseña nunca en texto plano, bcrypt cost >= 10 (backend <= 12)
- RN-AU02: Access token 30 min, contiene userId/email/roles, HS256
- RN-AU03: Refresh token 7 días, UUID opaco, almacenado en BD
- RN-AU04: Rotación de refresh token
- RN-AU05: Reuso de refresh token → revoca TODOS los tokens
- RN-AU06: Rate limiting 5/15min
- RN-AU07: Rol CLIENT asignado automáticamente en registro
- RN-AU08: Login no diferencia "email no existe" vs "contraseña incorrecta"
- RN-DA04: Email con UNIQUE constraint

### Notas Técnicas
- Passlib.bcrypt para hashing (cost >= 12 en producción)
- python-jose para JWT (HS256)
- slowapi para rate limiting
- RefreshToken table: token_hash (SHA-256), expires_at, revoked_at
- Axios interceptor: detectar 401, llamar refresh, actualizar authStore, reintentar
- Frontend: JWT decode sin validar firma (solo lectura de claims) para roles

---

## 01-rbac-roles-permissions

### Metadata
- **ID**: 01-rbac-roles-permissions
- **Épica**: ÉPICA 01 — Autenticación y Autorización
- **Prioridad**: Alta
- **Esfuerzo estimado**: 1-2 semanas

### Descripción
Implementación del modelo RBAC (Role-Based Access Control) con 4 roles (ADMIN, STOCK, PEDIDOS, CLIENT), verificación de permisos en endpoints, y protección de rutas en frontend.

### Historias de Usuario Cubiertas
- US-005: Gestión de roles (RBAC)
- US-006: Protección de rutas por rol
- US-075: Navegación por rol
- US-076: Protección de rutas en frontend
- US-066: Manejo de token expirado en frontend
- US-067: Manejo de errores global en frontend

### Dependencias
- 01-auth-jwt-register-login (autenticación debe estar lista)
- 00-postgres-migrations-seed (tablas Rol y UsuarioRol)

### Funcionalidades Clave
- **Backend**:
  - Modelos Rol y UsuarioRol con relación N:M
  - 4 roles seed: ADMIN (1), STOCK (2), PEDIDOS (3), CLIENT (4)
  - Dependencia `require_role([roles])`: verifica que usuario tenga al menos uno de los roles
  - Endpoint `PUT /api/v1/admin/usuarios/{id}/roles`: asignar roles (solo ADMIN)
  - Validación: ADMIN no puede quitarse rol ADMIN si es el único
  
- **Frontend**:
  - Componente ProtectedRoute HOC: verifica rol antes de renderizar
  - Navbar/Sidebar renderizado dinámicamente según rol
  - Error 403 handler con mensaje claro
  - Redirección a login si se detecta 401

### Criterios de Aceptación Resumidos
- [x] 4 roles implementados con IDs estables
- [x] `require_role()` valida permisos → HTTP 403 si insuficiente
- [x] Endpoint de asignación de roles (solo ADMIN)
- [x] ADMIN no puede quitarse rol si es único
- [x] Frontend renderiza UI según rol del usuario
- [x] ProtectedRoute bloquea acceso sin rol
- [x] Error 403 muestra mensaje claro
- [x] Error 401 maneja refresh + retry

### Reglas de Negocio Relevantes
- RN-RB01: 4 roles fijos con IDs estables
- RN-RB02: Un usuario puede tener múltiples roles
- RN-RB03: Solo ADMIN puede asignar roles
- RN-RB04: ADMIN no puede quitarse rol si es único
- RN-RB05: CLIENT solo ve sus propios datos
- RN-RB06: STOCK sin acceso a pedidos/usuarios
- RN-RB07: PEDIDOS sin acceso a catálogo/usuarios
- RN-RB08: Solo ADMIN puede cancelar en EN_PREP
- RN-RB09: Acceso denegado → HTTP 403
- RN-RB10: Sin token → HTTP 401, rutas públicas sin auth

### Notas Técnicas
- UsuarioRol: tabla pivote con UNIQUE compuesta (usuario_id, rol_id)
- JWT include roles como array de strings
- Frontend: decode JWT sin validación, extraer roles, verificar en ProtectedRoute
- Error boundary global para manejar 403

---

# ÉPICA 02 — Catálogo de Productos y Categorías

## 02-categorias-jerarquicas

### Metadata
- **ID**: 02-categorias-jerarquicas
- **Épica**: ÉPICA 02 — Catálogo de Productos y Categorías
- **Prioridad**: Alta
- **Esfuerzo estimado**: 2 semanas

### Descripción
Implementación de categorías jerárquicas con soporte para relaciones padre-hijo recursivas, validación de ciclos, y queries eficientes con CTE recursivo de PostgreSQL.

### Historias de Usuario Cubiertas
- US-007: Crear categoría
- US-008: Listar categorías jerárquicas
- US-009: Editar categoría
- US-010: Eliminar categoría (soft delete)

### Dependencias
- 01-rbac-roles-permissions (autorización debe estar implementada)
- 00-postgres-migrations-seed (tabla Categoria debe existir)

### Funcionalidades Clave
- **Backend**:
  - Modelo Categoria con `parent_id` FK autoreferencial
  - CRUD: `POST /api/v1/categorias`, `GET /api/v1/categorias`, `PUT /api/v1/categorias/{id}`, `DELETE /api/v1/categorias/{id}`
  - Validación: no permitir ciclos en jerarquía (validar con CTE antes de INSERT)
  - Validación: no permitir que categoría sea padre de sí misma
  - Validación: no eliminar categoría con productos activos (soft delete)
  - Query jerarquía: CTE recursivo para obtener árbol completo
  
- **Frontend**:
  - Formulario de creación/edición con dropdown jerárquico
  - Visualización de árbol de categorías
  - Confirmación antes de eliminar

### Criterios de Aceptación Resumidos
- [x] Crear categoría con nombre obligatorio, padre opcional
- [x] Listar como árbol jerárquico (anidado)
- [x] Validar: no ciclos, no auto-padre
- [x] Editar nombre o jerarquía (con validación)
- [x] Soft delete si no tiene productos activos
- [x] Query CTE recursivo eficiente
- [x] Frontend renderiza árbol visual

### Reglas de Negocio Relevantes
- RN-CA01: Jerarquía recursiva vía FK self-referencing
- RN-CA02: No ciclos, no auto-padre
- RN-CA03: No eliminar si tiene productos activos
- RN-CA09: Soft delete (eliminado_en timestamp)

### Notas Técnicas
- SQL CTE para validar ciclos: `WITH RECURSIVE parent_chain AS (...)`
- Modelo: `parent_id BIGINT FK self-ref, NULL`
- Service: validar ciclos antes de UPDATE parent_id
- Frontend: Component recursivo para renderizar árbol

---

## 02-ingredientes-alergenos

### Metadata
- **ID**: 02-ingredientes-alergenos
- **Épica**: ÉPICA 02 — Catálogo de Productos y Categorías
- **Prioridad**: Alta
- **Esfuerzo estimado**: 1-2 semanas

### Descripción
Implementación del catálogo de ingredientes con flag de alérgenos, permitiendo que los clientes identifiquen productos con restricciones dietarias.

### Historias de Usuario Cubiertas
- US-011: Crear ingrediente
- US-012: Listar ingredientes
- US-013: Editar ingrediente
- US-014: Eliminar ingrediente (soft delete)

### Dependencias
- 01-rbac-roles-permissions (autorización)
- 00-postgres-migrations-seed (tabla Ingrediente)

### Funcionalidades Clave
- **Backend**:
  - Modelo Ingrediente con `nombre` (UNIQUE), `es_alergeno` (BOOLEAN)
  - CRUD: `POST /api/v1/ingredientes`, `GET /api/v1/ingredientes`, `PUT /api/v1/ingredientes/{id}`, `DELETE /api/v1/ingredientes/{id}`
  - Filtro: `GET /api/v1/ingredientes?esAlergeno=true`
  - Paginación: skip/limit
  
- **Frontend**:
  - Lista de ingredientes con filtro por alérgeno
  - Formulario de alta/edición
  - Badge visual para alérgenos

### Criterios de Aceptación Resumidos
- [x] Crear ingrediente con nombre único, es_alergeno booleano
- [x] Listar con paginación
- [x] Filtrar por es_alergeno=true
- [x] Editar nombre/flag
- [x] Soft delete
- [x] Frontend muestra badge para alérgenos

### Reglas de Negocio Relevantes
- RN-CA07: Ingrediente con M2M a Producto, con flag es_alergeno

### Notas Técnicas
- Modelo: `nombre VARCHAR(100) UNIQUE, es_alergeno BOOLEAN DEFAULT false`
- Service: validar nombre único
- Frontend: TanStack Query para cacheo

---

## 02-productos-catalogo

### Metadata
- **ID**: 02-productos-catalogo
- **Épica**: ÉPICA 02 — Catálogo de Productos y Categorías
- **Prioridad**: Alta
- **Esfuerzo estimado**: 3 semanas

### Descripción
Implementación del catálogo completo de productos con precio, stock, disponibilidad, asociación a categorías e ingredientes, y búsqueda/filtrado públicos.

### Historias de Usuario Cubiertas
- US-015: Crear producto
- US-016: Asociar producto a categorías
- US-017: Asociar ingredientes a producto
- US-018: Listar productos del catálogo (público)
- US-019: Ver detalle de producto
- US-020: Editar producto
- US-021: Gestionar stock de producto
- US-022: Eliminar producto (soft delete)
- US-023: Filtrar productos por alergenos

### Dependencias
- 02-categorias-jerarquicas (categorías deben estar listos)
- 02-ingredientes-alergenos (ingredientes deben estar listos)
- 00-postgres-migrations-seed (tabla Producto)

### Funcionalidades Clave
- **Backend**:
  - Modelo Producto: nombre, descripcion, precio (DECIMAL 10,2), stock_cantidad (INTEGER), disponible (BOOLEAN), imagen_url
  - Relación M2M: ProductoCategoria, ProductoIngrediente
  - CRUD: POST/GET/PUT/DELETE `/api/v1/productos`
  - Público: `GET /api/v1/productos` (filtra disponible=true, no eliminados)
  - Detalle: `GET /api/v1/productos/{id}` (con categorías e ingredientes)
  - Stock: `PATCH /api/v1/productos/{id}/stock` (incremento o seteo)
  - Disponibilidad: `PATCH /api/v1/productos/{id}/disponibilidad`
  - Filtros: búsqueda por nombre (ILIKE), categoría, precio, sin alergenos
  - Paginación: skip/limit
  
- **Frontend**:
  - Grid de productos con skeleton loaders
  - Búsqueda con debounce
  - Filtros: categoría, precio (rango), alergenos a excluir
  - Paginación
  - Detalle: modal o página con full info + agregación al carrito

### Criterios de Aceptación Resumidos
- [x] Crear producto con precio DECIMAL, stock INTEGER, disponible BOOLEAN
- [x] Asociar múltiples categorías (M2M)
- [x] Asociar múltiples ingredientes (M2M)
- [x] Listar público: solo disponibles, no eliminados
- [x] Detalle incluye categorías + ingredientes con alérgenos
- [x] Stock actualizable solo por STOCK/ADMIN
- [x] Soft delete
- [x] Búsqueda por nombre con ILIKE
- [x] Filtro por categoría, precio, sin alergenos
- [x] Paginación skip/limit
- [x] Frontend: búsqueda con debounce, skeleton loaders

### Reglas de Negocio Relevantes
- RN-CA04: Precio como DECIMAL(10,2), no float
- RN-CA05: Stock INTEGER >= 0
- RN-CA06: M2M Producto-Categoria
- RN-CA07: M2M Producto-Ingrediente con es_alergeno
- RN-CA08: Catálogo público: disponible=true, eliminado_en IS NULL
- RN-CA09: Soft delete
- RN-CA10: Admin puede ver eliminados con param incluir_eliminados

### Notas Técnicas
- Precio: DECIMAL(10,2) para evitar errores de punto flotante
- Stock: atomicidad en UPDATE (SELECT FOR UPDATE en transacción)
- Categorías: query desde ProductoCategoria + Categoria
- Ingredientes: query desde ProductoIngrediente + Ingrediente, incluir es_alergeno
- Frontend: TanStack Query con queryKey por filtros (busqueda, categoria, etc)
- Búsqueda: debounce 300-500ms

---

# ÉPICA 03 — Gestión de Direcciones

## 03-direcciones-entrega

### Metadata
- **ID**: 03-direcciones-entrega
- **Épica**: ÉPICA 03 — Gestión de Direcciones
- **Prioridad**: Media-Alta
- **Esfuerzo estimado**: 1-2 semanas

### Descripción
Implementación de gestión de direcciones de entrega con CRUD completo, soporte para dirección principal por usuario, y validación de ownership.

### Historias de Usuario Cubiertas
- US-024: Crear dirección (primera como principal)
- US-025: Listar direcciones propias
- US-026: Editar dirección
- US-027: Eliminar dirección (soft delete)
- US-028: Marcar dirección como principal

### Dependencias
- 01-auth-jwt-register-login (usuarios deben estar autenticados)
- 00-postgres-migrations-seed (tabla DireccionEntrega)

### Funcionalidades Clave
- **Backend**:
  - Modelo DireccionEntrega: usuario_id (FK), alias, linea1, linea2 (opcional), ciudad, codigo_postal, referencia (opcional), es_principal (BOOLEAN)
  - CRUD: POST/GET/PUT/DELETE `/api/v1/direcciones`
  - Validación: cliente solo ve/edita sus propias direcciones (ownership by userId del JWT)
  - Primera dirección automáticamente marcada como principal
  - Solo una dirección principal por usuario (validación en service)
  - Soft delete
  
- **Frontend**:
  - Formulario de alta/edición
  - Listado de direcciones propias
  - Selector de dirección principal (radio button)
  - Soft delete con confirmación

### Criterios de Aceptación Resumidos
- [x] Cliente registrado puede crear dirección
- [x] Primera dirección automáticamente principal
- [x] Solo una dirección principal por usuario
- [x] Cliente solo ve/edita sus direcciones
- [x] Hard delete (modelo DB no tiene deleted_at — adaptación documentada en design.md)
- [x] Frontend: formulario + lista + selector principal

### Reglas de Negocio Relevantes
- RN-DI01: Múltiples direcciones por cliente, primera como predeterminada
- RN-DI02: Solo una principal a la vez
- RN-DI03: Ownership por userId del JWT

### Notas Técnicas
- Validación: `usuario_id = decoded_jwt.sub`
- Modelo: `es_principal BOOLEAN DEFAULT false`
- Service: antes de UPDATE es_principal=true, verificar que es_principal=false para otras direcciones

---

# ÉPICA 04 — Carrito de Compras

## 04-carrito-cliente

### Metadata
- **ID**: 04-carrito-cliente
- **Épica**: ÉPICA 04 — Carrito de Compras
- **Prioridad**: Media-Alta
- **Esfuerzo estimado**: 1-2 semanas

### Descripción
Implementación del carrito de compras 100% client-side usando Zustand + localStorage, con persistencia entre sesiones y soporte para personalización (exclusión de ingredientes).

### Historias de Usuario Cubiertas
- US-029: Agregar producto al carrito
- US-030: Personalizar ingredientes (excluir)
- US-031: Modificar cantidad en carrito
- US-032: Eliminar ítem del carrito
- US-033: Ver resumen del carrito
- US-034: Limpiar carrito

### Dependencias
- 02-productos-catalogo (productos deben estar disponibles)
- 00-zustand-stores-setup (cartStore implementado)

### Funcionalidades Clave
- **Frontend**:
  - cartStore Zustand con persistencia localStorage
  - Agregar producto: incrementa cantidad si ya existe
  - Personalización: excluir ingredientes (array de IDs)
  - Modificar cantidad: sin límite min/max en carrito (validar al crear pedido)
  - Eliminar ítem: remueve del array
  - Limpiar: reset del estado
  - Cálculo: subtotal (qty × precio), total (suma subtotales)
  - Persistencia: survives reload, logout/login, cierre navegador

### Criterios de Aceptación Resumidos
- [x] Carrito solo client-side (no backend)
- [x] Persistencia en localStorage
- [x] Agregar producto: incremente qty si existe
- [x] Personalización: excluir ingredientes (solo los que tiene el producto)
- [x] Modificar cantidad: update en carrito
- [x] Eliminar ítem: remove
- [x] Limpiar: reset
- [x] Cálculos: subtotal, total correcto
- [x] Persiste tras reload/logout/cierre navegador

### Reglas de Negocio Relevantes
- RN-CR01: Carrito client-side only
- RN-CR02: Persiste al cerrar, refresh, logout/login
- RN-CR03: Duplicado → incremente qty
- RN-CR04: Solo excluir ingredientes que producto tiene
- RN-CR05: Personalización como INTEGER[]

### Notas Técnicas
- cartStore: items CartItem[] = {productoId, producto (snapshot), cantidad, personalizacion: number[]}
- Persistencia: middleware persist + partialize (guardar items)
- Validación: al agregar, verificar que personalizacion IDs existen en producto.ingredientes

---

# ÉPICA 05 — Pedidos (Creación y Máquina de Estados)

## 05-pedidos-creacion-fsm

### Metadata
- **ID**: 05-pedidos-creacion-fsm
- **Épica**: ÉPICA 05 — Pedidos (Creación y Máquina de Estados)
- **Prioridad**: Alta (núcleo del negocio)
- **Esfuerzo estimado**: 4 semanas

### Descripción
Implementación completa del dominio de pedidos: creación atómica desde carrito, máquina de estados finitos (FSM) con 6 estados, audit trail append-only de transiciones, y validaciones de negocio complejas.

### Historias de Usuario Cubiertas
- US-035: Crear pedido desde carrito
- US-036: Validar stock suficiente
- US-037: Snapshot de precios en pedido
- US-038: Snapshot de dirección en pedido
- US-039: Avanzar estado del pedido (PENDIENTE → CONFIRMADO)
- US-040: Avanzar estado (CONFIRMADO → EN_PREP)
- US-041: Avanzar estado (EN_PREP → EN_CAMINO)
- US-042: Avanzar estado (EN_CAMINO → ENTREGADO)
- US-043: Cancelar pedido (restaurar stock)
- US-044: Ver historial de transiciones (audit trail)

### Dependencias
- 01-auth-jwt-register-login (usuarios autenticados)
- 02-productos-catalogo (productos con stock)
- 03-direcciones-entrega (direcciones disponibles)
- 04-carrito-cliente (carrito de donde se crea el pedido)
- 00-postgres-migrations-seed (tablas Pedido, DetallePedido, EstadoPedido, HistorialEstadoPedido)

### Funcionalidades Clave
- **Backend**:
  - Modelo Pedido: usuario_id, estado (FK EstadoPedido), direccion_id, forma_pago_id, costo_envio, total, snapshots (direccion_snapshot)
  - Modelo DetallePedido: pedido_id, producto_id, cantidad, nombre_snapshot, precio_snapshot, subtotal, personalizacion (INTEGER[])
  - Modelo HistorialEstadoPedido: append-only con pedido_id, estado_desde, estado_hacia, usuario_id (NULL si sistema), motivo, creado_en
  - Endpoint `POST /api/v1/pedidos`: crear desde carrito (UoW atómico)
    - Validar usuario, dirección pertenece a usuario
    - Validar productos: disponible=true, stock suficiente (SELECT FOR UPDATE)
    - Crear snapshots de precios
    - Crear Pedido (estado=PENDIENTE)
    - Crear DetallesPedido
    - Crear HistorialEstadoPedido inicial (estado_desde=NULL)
    - Si error en cualquier paso → ROLLBACK
  - Endpoint `PATCH /api/v1/pedidos/{id}/estado`: avanzar estado
    - Validar transición permitida (FSM)
    - Si PENDIENTE → CONFIRMADO: decrementar stock (UoW atómico)
    - Crear HistorialEstadoPedido con nueva transición
    - Registrar usuario que ejecutó transición
  - Endpoint `DELETE /api/v1/pedidos/{id}`: cancelar pedido
    - Validar que cliente es propietario (o ADMIN)
    - Validar que estado permite cancelación
    - Si estado=CONFIRMADO: restaurar stock atómicamente
    - Crear HistorialEstadoPedido con estado_hacia=CANCELADO
  - Endpoint `GET /api/v1/pedidos`: listado con paginación
    - CLIENT: solo sus pedidos
    - PEDIDOS/ADMIN: todos
    - Filtrar por estado, fecha
  - Endpoint `GET /api/v1/pedidos/{id}`: detalle completo
    - Detalles, historial, snapshots
  - Endpoint `GET /api/v1/pedidos/{id}/historial`: historial chronológico
  
- **Frontend**:
  - Crear pedido: formulario con carrito, seleccionar dirección, forma de pago
  - Listado de pedidos: tabla con estado, total, fecha
  - Detalle: modal con detalles, precio snapshot, historial de estados
  - Timeline de transiciones (visual clara)
  - Cancelación: solo si permite (PENDIENTE o CONFIRMADO)

### Criterios de Aceptación Resumidos
- [x] Crear pedido UoW atómico (todo o nada)
- [x] Validación: usuario, dirección ownership, productos disponibles, stock suficiente
- [x] Snapshots: precio_snapshot, nombre_snapshot, direccion_snapshot
- [x] Pedido nace en PENDIENTE con historial inicial
- [x] Máquina de estados: PENDIENTE→CONFIRMADO→EN_PREP→EN_CAMINO→ENTREGADO
- [x] Cancelación desde PENDIENTE, CONFIRMADO, EN_PREP (solo ADMIN)
- [x] Restauración de stock en cancelación (si CONFIRMADO)
- [x] Historial append-only (nunca UPDATE/DELETE)
- [x] Listado: CLIENT ve solo suyo, PEDIDOS/ADMIN ven todos
- [x] Frontend: crear, listar, detalle, cancelar, timeline visual

### Reglas de Negocio Relevantes
- RN-PE01: Creación ATÓMICA con UoW
- RN-PE02-04: Snapshots de precio, dirección, validación stock SELECT FOR UPDATE
- RN-PE05-08: Pedido en PENDIENTE, personalizacion INTEGER[], total correctamente calculado
- RN-FS01-09: FSM con 6 estados, transiciones válidas, ENTREGADO/CANCELADO terminales, append-only history
- RN-RB05: CLIENT solo ve sus pedidos
- RN-RB07: PEDIDOS ve todos pero no edita rol/usuarios
- RN-RB08: Solo ADMIN cancela en EN_PREP

### Notas Técnicas
- UnitOfWork: abierto durante creación, commit solo si todo OK
- Service: recibe `uow`, `usuario_id`, `carrito_items`, `direccion_id`, `forma_pago_id`
- Stock: SELECT FOR UPDATE en transacción para evitar race condition
- HistorialEstadoPedido: `estado_desde NULL` para transición inicial (RN-02)
- Cancelación: lógica para restaurar stock si fue CONFIRMADO
- Frontend: TanStack Query para pedidos (invalidate tras cambio de estado)

---

# ÉPICA 06 — Pagos con MercadoPago

## 06-pagos-mercadopago

### Metadata
- **ID**: 06-pagos-mercadopago
- **Épica**: ÉPICA 06 — Pagos con MercadoPago
- **Prioridad**: Alta (crítico para monetización)
- **Esfuerzo estimado**: 3 semanas

### Descripción
Integración completa con MercadoPago usando Checkout API (Orders), incluyendo tokenización de tarjetas PCI-compliant, webhooks IPN para confirmación asíncrona de pagos, y manejo de estados de pago.

### Historias de Usuario Cubiertas
- US-045: Integración MercadoPago PCI SAQ-A
- US-046: Procesar pago aprobado (automático)
- US-047: Manejar pago rechazado
- US-048: Reintentar pago

### Dependencias
- 05-pedidos-creacion-fsm (pedidos deben existir)
- 00-zustand-stores-setup (paymentStore implementado)

### Funcionalidades Clave
- **Backend**:
  - Modelo Pago: pedido_id (FK), monto, mp_payment_id, mp_status (pending/approved/rejected/in_process), external_reference (UUID pedido), idempotency_key (UUID único)
  - Endpoint `POST /api/v1/pagos/crear`: crea orden en MercadoPago
    - Valida pedido existe y está en PENDIENTE
    - Genera idempotency_key UUID
    - Llama SDK MercadoPago.Orders.create()
    - Registra intento en tabla Pago
    - Retorna preference_id y checkout_url
  - Endpoint `POST /api/v1/pagos/webhook`: webhook IPN de MercadoPago
    - Valida firma (algoritmo de MercadoPago)
    - Extrae topic=payment, mp_payment_id
    - Consulta API MercadoPago para estado real
    - Si idempotency_key ya procesado → ignora (idempotencia)
    - Si approved: avanza Pedido a CONFIRMADO automáticamente (con decremento de stock)
    - Si rejected/pending: actualiza Pago sin cambiar estado del Pedido
    - Responde HTTP 200 rápidamente (no bloquea)
  - Endpoint `GET /api/v1/pagos/{pedido_id}`: consulta pago de un pedido
  
- **Frontend**:
  - Componente CardPayment: integra SDK @mercadopago/sdk-react
  - Tokenización: cliente ingresa tarjeta en form de MP, se genera card_token (nunca toca nuestro servidor)
  - Checkout: botón "Pagar" que llama backend `POST /api/v1/pagos/crear` con token
  - Polling o webhook: detecta cuando pago fue aprobado (por ahora polling cada 3-5s)
  - paymentStore: tracking de status (idle/processing/approved/rejected/error)
  - Redirección: si aprobado → mostrar pedido confirmado, si rechazado → opción reintentar

### Criterios de Aceptación Resumidos
- [x] Crear orden en MercadoPago con SDK Python
- [x] Webhook IPN recibe notificación de pago
- [x] Validar firma de webhook
- [x] Idempotency key previene cobros duplicados
- [x] Pago aprobado → Pedido avanza a CONFIRMADO automáticamente
- [x] Stock decrementado en transición a CONFIRMADO
- [x] Pago rechazado → Pedido permanece PENDIENTE
- [x] Webhook responde 200 rápidamente
- [x] Frontend: tokenización segura, sin datos de tarjeta en nuestro servidor
- [x] Polling o polling-ws detecta confirmación

### Reglas de Negocio Relevantes
- RN-AU09: Datos de tarjeta NUNCA tocan nuestro servidor (PCI DSS SAQ-A)
- RN-PA01: Tokenización en browser vía SDK MercadoPago.js
- RN-PA02: idempotency_key único previene duplicados
- RN-PA03: Webhook responde 200 inmediatamente
- RN-PA04: Siempre verificar estado real en API MP (no confiar solo en webhook)
- RN-PA05: Pago approved → transición automática PENDIENTE→CONFIRMADO + decremento stock
- RN-PA06: Pago rejected → pedido permanece PENDIENTE
- RN-PA07: Pago pending/in_process → actualizar Pago, pedido sigue PENDIENTE
- RN-PA08: Múltiples intentos de pago por pedido (1:N)
- RN-PA09: external_reference vincula MP con pedido

### Notas Técnicas
- SDK Python: `mercadopago` con cliente MercadopagoClient(access_token)
- Webhook: URL registrada en Dashboard MP (VITE_MP_NOTIFICATION_URL)
- Idempotency key: UUID + UNIQUE constraint en tabla Pago
- Firma de webhook: validar con signature de header + secret MP
- External reference: `str(pedido.id)` o UUID — documentar en tabla
- Frontend: SDK React @mercadopago/sdk-react + CardPayment component
- Polling: cada 3-5s verificar status con `GET /api/v1/pagos/{pedido_id}`

---

# ÉPICA 07 — Panel de Administración

## 07-admin-dashboard-metricas

### Metadata
- **ID**: 07-admin-dashboard-metricas
- **Épica**: ÉPICA 07 — Panel de Administración
- **Prioridad**: Media
- **Esfuerzo estimado**: 2-3 semanas

### Descripción
Implementación del dashboard administrativo con métricas, gráficos de negocio, y CRUDs completos para gestión de productos, categorías, usuarios, stock y pedidos.

### Historias de Usuario Cubiertas
- US-049: Listar usuarios con paginación
- US-050: Ver detalle de usuario
- US-051: Buscar usuarios
- US-052: Crear usuario manual
- US-053: Editar usuario
- US-054: Asignar/revocar roles
- US-055: Eliminar usuario (soft delete)
- US-056: Panel de métricas de negocio
- US-057: Gráfico de ventas (recharts)
- US-058: Gráfico de productos top
- US-059: Gráfico de estado de pedidos
- US-060: Gestión de stock desde admin
- US-062: Editar perfil propio
- US-063: Cambiar contraseña
- US-064: Admin ver registros eliminados
- US-065: Exportar reportes

### Dependencias
- Todas las épicas anteriores (este change cubre admin)

### Funcionalidades Clave
- **Backend**:
  - Endpoints CRUD para usuarios (solo ADMIN):
    - `GET /api/v1/admin/usuarios` (con paginación)
    - `GET /api/v1/admin/usuarios/{id}`
    - `POST /api/v1/admin/usuarios` (crear manual)
    - `PUT /api/v1/admin/usuarios/{id}` (editar)
    - `DELETE /api/v1/admin/usuarios/{id}` (soft delete)
    - `PUT /api/v1/admin/usuarios/{id}/roles` (asignar roles)
  - Endpoints de métricas (solo ADMIN):
    - `GET /api/v1/admin/metricas/dashboard`: retorna {total_pedidos, total_ingresos, pedidos_hoy, top_productos}
    - `GET /api/v1/admin/metricas/ventas?period=mes`: ingresos por día/semana/mes
    - `GET /api/v1/admin/metricas/productos-top`: productos más vendidos
    - `GET /api/v1/admin/metricas/estados-pedidos`: distribución de estados
  - Endpoint `GET /api/v1/admin/registros-eliminados`: listar registros soft-deleted (con filtro por tabla)
  - Endpoint `GET /api/v1/perfil`: ver perfil propio
  - Endpoint `PUT /api/v1/perfil`: editar perfil propio
  - Endpoint `POST /api/v1/perfil/cambiar-contrasena`: cambiar password
  
- **Frontend**:
  - Page `/admin/dashboard`: dashboard con KPIs y gráficos
    - Cards de: Total de pedidos, Ingresos totales, Pedidos hoy, Top producto
    - Gráficos recharts: línea (ingresos última semana), barra (productos top), pie (distribución estados)
  - Page `/admin/usuarios`: tabla CRUD
    - Filtro, búsqueda, paginación
    - Modal de crear/editar
    - Asignación de roles (checkboxes)
    - Soft delete con confirmación
  - Page `/admin/productos`: tabla de productos
    - CRUD (create, edit, delete)
    - Asociación de categorías e ingredientes
  - Page `/admin/categorias`: árbol de categorías
    - CRUD
  - Page `/admin/stock`: tabla de productos enfocada en stock
    - Editar cantidad
  - Page `/admin/pedidos`: tabla filterable por estado
    - Ver detalle, cambiar estado
  - Page `/perfil`: editar perfil propio
  - Page `/cambiar-contrasena`: formulario de cambio de password

### Criterios de Aceptación Resumidos
- [x] Dashboard con 4 KPIs principales
- [x] Gráficos recharts: línea (ventas), barra (productos), pie (estados)
- [x] CRUD usuarios funcional (solo ADMIN)
- [x] Asignación de roles
- [x] Soft delete usuarios
- [x] CRUD productos desde admin
- [x] CRUD categorías
- [x] Gestión de stock
- [x] Gestión de pedidos (cambiar estado)
- [x] Ver registros eliminados
- [x] Editar perfil propio
- [x] Cambiar contraseña
- [ ] Paginación, búsqueda, filtros

### Reglas de Negocio Relevantes
- RN-RB03: Solo ADMIN asigna roles
- RN-RB04: ADMIN no puede quitarse rol si es único
- RN-RB05: CLIENT solo ve su datos, ADMIN ve todos
- RN-CA10: Admin puede ver eliminados con incluir_eliminados=true

### Notas Técnicas
- Métricas: queries complejas con agregaciones (SUM, COUNT, GROUP BY)
- Gráficos: recharts con LineChart, BarChart, PieChart
- TanStack Query: queryKeys por sección (admin/usuarios, admin/dashboard, etc)
- Invalidación: tras crear/editar/eliminar usuario/producto, invalidate queries relevantes
- Formularios: TanStack Form con validaciones
- Tablas: DataTable component reutilizable con sorting, filtering, pagination

---

## 07-navegacion-layout-base

### Metadata
- **ID**: 07-navegacion-layout-base
- **Épica**: ÉPICA 07 — Panel de Administración
- **Prioridad**: Media-Alta
- **Esfuerzo estimado**: 1-2 semanas

### Descripción
Implementación de navegación y layout base compartido por toda la aplicación, adaptado dinámicamente según rol del usuario.

### Historias de Usuario Cubiertas
- US-075: Navegación por rol
- US-076: Protección de rutas en frontend (ya cubierto en RBAC, esta es complementaria)

### Dependencias
- 01-rbac-roles-permissions (roles deben estar implementados)

### Funcionalidades Clave
- **Frontend**:
  - Componente `Navbar`: logo, menú adaptado por rol, user menu (perfil, logout)
  - Componente `Sidebar`: navegación vertical con links organizados por rol
  - Layout principal: Navbar + Sidebar + Outlet
  - Menús condicionales:
    - CLIENT: Catálogo, Mi carrito, Mis pedidos, Mi perfil, Mis direcciones
    - STOCK: Productos, Categorías, Ingredientes, Stock
    - PEDIDOS: Panel de Pedidos
    - ADMIN: Todos los anteriores + Usuarios, Métricas, Configuración
  - Navegación anónima: Catálogo, Login, Registrarse
  - Responsive: sidebar colapsable en mobile

### Criterios de Aceptación Resumidos
- [x] Navbar con logo y menú contextual
- [x] Sidebar adapta opciones por rol
- [x] Layout: Navbar + Sidebar + Outlet
- [x] Sidebar colapsable en mobile
- [x] Links funcionan según rol
- [x] Logout desde user menu
- [x] Diseño responsive

### Reglas de Negocio Relevantes
- RN-RB06: STOCK sin acceso a pedidos/usuarios
- RN-RB07: PEDIDOS sin acceso a catálogo/usuarios

### Notas Técnicas
- Hook `useAuthStore`: obtener rol del usuario
- Componentes condicionales con &&
- CSS/Tailwind: responsive classes (hidden md:block)

---

# Dependencias Globales (Summary)

```
00-scaffold-monorepo
└── 00-backend-fastapi-setup
    ├── 00-postgres-migrations-seed
    │   ├── 02-categorias-jerarquicas
    │   │   ├── 02-ingredientes-alergenos
    │   │   │   └── 02-productos-catalogo
    │   │   │       └── 04-carrito-cliente
    │   │   │           └── 05-pedidos-creacion-fsm
    │   │   │               └── 06-pagos-mercadopago
    │   │   └── 03-direcciones-entrega
    │   ├── 01-auth-jwt-register-login
    │   │   └── 01-rbac-roles-permissions
    │   │       ├── 07-admin-dashboard-metricas
    │   │       └── 07-navegacion-layout-base
    └── 00-frontend-vite-setup
        ├── 00-zustand-stores-setup
        │   └── 01-auth-jwt-register-login
        │       └── [idem backend]
        └── [todos usan frontend-vite base]
```

---

# Timeline de Implementación Recomendada

| Semana | Changes | Estado |
|--------|---------|--------|
| 1      | 00-scaffold-monorepo, 00-backend-fastapi-setup, 00-frontend-vite-setup | Setup |
| 2-3    | 00-postgres-migrations-seed, 00-zustand-stores-setup | Infraestructura |
| 4-5    | 01-auth-jwt-register-login | Auth |
| 6      | 01-rbac-roles-permissions | Autorización |
| 7-8    | 02-categorias-jerarquicas, 02-ingredientes-alergenos | Catálogo fundacional |
| 9-11   | 02-productos-catalogo | Catálogo principal |
| 12     | 03-direcciones-entrega | Dirección |
| 13     | 04-carrito-cliente | Carrito |
| 14-17  | 05-pedidos-creacion-fsm | Pedidos (núcleo) |
| 18-20  | 06-pagos-mercadopago | Pagos |
| 21-22  | 07-admin-dashboard-metricas, 07-navegacion-layout-base | Admin |
| 23     | Testing, bug fixes, deploy | QA |

**Total estimado:** 23 semanas (5-6 meses con equipo chico)

---

# Checklist de Validación por Change

Antes de proponer cada change:

- [ ] ¿Todas las dependencias están completadas?
- [ ] ¿Las historias de usuario están completamente mapeadas?
- [ ] ¿Las reglas de negocio son claras?
- [ ] ¿El esfuerzo estimado es realista (1-5 semanas)?
- [ ] ¿Los criterios de aceptación son verificables?
- [ ] ¿La arquitectura (capas, patrones) está documentada?

Antes de aplicar cada change:

- [ ] Proposal aprobado (descripción, historias, dependencias)
- [ ] Design aprobado (arquitectura, modelos, queries, componentes)
- [ ] Tasks generados y desglosados en subtareas atómicas

---

## Notas Finales

1. **Este mapa es fluido.** Si durante la implementación de un change descubrís que necesitas ajustar el scope o dividir un change en dos, adelante. Documentá el cambio.

2. **Cada change genera specs.** Al completar un change y archivarlo, las specifications van a `openspec/specs/{modulo}/spec.md` para que los cambios futuros las consulten.

3. **Patrón crítico: Unit of Work.** Ninguna operación que toque múltiples tablas debe hacer commit/rollback manual en el service. El UoW maneja eso.

4. **Patrón crítico: Snapshot.** Pedidos, DetallePedido, y Pago usan snapshots. Esto garantiza inmutabilidad histórica.

5. **Patrón crítico: Append-only.** HistorialEstadoPedido NUNCA se modifica. Solo INSERT.

6. **Testing.** Considerá agregegar tests unitarios (pytest para backend, vitest/jest para frontend) a partir del change 05 en adelante.

---

**Documento generado por análisis arquitectónico SDD.**  
**Úsalo como guía en `/opsx:propose` y `/opsx:apply` para cada change.**
