# Food Store — Repositorio Base

Sistema de e-commerce de productos alimenticios desarrollado con **Spec-Driven Development (SDD)** usando OPSX y Claude Code.

---

## Documentación del sistema

Antes de escribir una línea de código, leé los tres documentos en `docs/`:

| Archivo | Contenido |
|---------|-----------|
| `docs/Descripcion.txt` | Visión general, actores del sistema y stack tecnológico |
| `docs/Integrador.txt` | Arquitectura en capas, ERD, API REST y patrones de diseño |
| `docs/Historias_de_usuario.txt` | US-000 a US-076 con criterios de aceptación y reglas de negocio |

Estos documentos son la fuente de verdad del sistema. El agente los lee antes de cada propuesta.

---

## Stack tecnológico

**Backend**: FastAPI · SQLModel · PostgreSQL · Alembic · bcrypt · python-jose · slowapi · MercadoPago SDK  
**Frontend**: React · TypeScript · Vite · TanStack Query · TanStack Form · Zustand · Axios · Tailwind CSS · Recharts

---

## Setup del entorno de desarrollo

### ✅ Requisitos completados en Sprint 0 (us-000-setup)

La infraestructura base ya está configurada:

- ✅ **Backend**: FastAPI configurado con SQLModel, Alembic migrations, y estructura modular
- ✅ **Frontend**: React + TypeScript + Vite con FSD (Feature-Sliced Design)
- ✅ **Base de datos**: 17 tablas normalizadas (3NF) con soft-delete y audit trail
- ✅ **Migrations**: Alembic setup con migración inicial que crea todo el schema
- ✅ **Seed script**: Datos iniciales (roles, estados, métodos de pago, usuario admin)
- ✅ **Documentation**: CONTRIBUTING.md con guías completas de setup y desarrollo

### Requisitos previos

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+

### 1. Configurar la base de datos PostgreSQL

```bash
# Crear la base de datos
createdb foodstore_db

# O mediante psql
psql -U postgres
CREATE DATABASE foodstore_db;
\q
```

### 2. Backend - Setup rápido

```bash
cd backend

# Copiar variables de entorno
cp .env.example .env

# Crear ambiente virtual
python -m venv venv

# Activar (Windows)
venv\Scripts\activate
# O en macOS/Linux
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar migraciones
python -m alembic upgrade head

# Llenar datos iniciales
python -m app.db.seed

# Iniciar servidor (http://localhost:8000)
python -m app
```

**Acceso a la API**:
- API: http://localhost:8000
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- Health check: http://localhost:8000/health

### 3. Frontend - Setup rápido

```bash
cd frontend

# Copiar variables de entorno
cp .env.example .env

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo (http://localhost:5173)
npm run dev
```

**Scripts disponibles**:
```bash
npm run dev              # Start dev server
npm run build           # Build for production
npm run preview         # Preview production build
npm run lint            # Run ESLint
npm run type-check      # Type checking with TypeScript
npm run format          # Format code with Prettier
```

---

### ✅ Requisitos completados en Sprint 0 (us-000-setup)

La infraestructura base ya está configurada:

- ✅ **Backend**: FastAPI configurado con SQLModel, Alembic migrations, y estructura modular
- ✅ **Frontend**: React + TypeScript + Vite con FSD (Feature-Sliced Design)
- ✅ **Base de datos**: 17 tablas normalizadas (3NF) con soft-delete y audit trail
- ✅ **Migrations**: Alembic setup con migración inicial que crea todo el schema
- ✅ **Seed script**: Datos iniciales (roles, estados, métodos de pago, usuario admin)
- ✅ **Documentation**: CONTRIBUTING.md con guías completas de setup y desarrollo

---

## Flujo de desarrollo con OPSX

Todo cambio al sistema sigue este ciclo:

```
/opsx:explore   →  pensar antes de comprometerse (opcional)
/opsx:propose   →  generar propuesta + diseño + tareas
/opsx:apply     →  implementar tarea por tarea
/opsx:archive   →  sincronizar specs y cerrar el change
```

### Orden de implementación

```
us-000-setup               ← infraestructura base (Sprint 0)
us-001-auth                ← JWT · RBAC · refresh tokens
us-002-categorias          ← catálogo jerárquico
us-003-productos           ← CRUD · stock · ingredientes
us-004-carrito             ← estado client-side con Zustand
us-005-pedidos             ← UoW · FSM · audit trail
us-006-pagos-mercadopago   ← checkout · webhooks IPN
us-007-admin               ← panel · métricas
us-008-direcciones         ← direcciones de entrega
```

---

## Variables de entorno

Crear `backend/.env` a partir de `backend/.env.example`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/foodstore
SECRET_KEY=tu-clave-secreta-de-64-caracteres-minimo
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
MP_ACCESS_TOKEN=TEST-tu-token-de-mercadopago
MP_PUBLIC_KEY=TEST-tu-public-key-de-mercadopago
CORS_ORIGINS=http://localhost:5173
```

Crear `frontend/.env` a partir de `frontend/.env.example`:

```env
VITE_API_URL=http://localhost:8000
VITE_MP_PUBLIC_KEY=TEST-tu-public-key-de-mercadopago
```

---

## Convenciones de commits

```
feat(modulo): descripción del cambio
fix(modulo): descripción del bug corregido
refactor(modulo): descripción del refactor
test(modulo): descripción de los tests
docs(modulo): descripción del cambio en docs
```
