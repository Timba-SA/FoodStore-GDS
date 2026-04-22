# Spec: project-setup

## Overview
Este spec define los requerimientos para la estructura de carpetas, archivos de configuración, variables de entorno y documentación necesaria para que un desarrollador pueda clonar el repositorio e iniciar ambos entornos (backend + frontend + BD) en su máquina local sin pasos adicionales no documentados.

## Requirements

### REQ-001: Estructura de carpetas del backend
El backend DEBE estar organizado en módulos por feature (feature-first). Cada módulo debe autocontener su lógica.

**Scenario: Estructura de backend correcta**
- Given: Repositorio clonado
- When: Se lista el contenido de `backend/app/modules/`
- Then: Existen directorios para: `auth`, `usuarios`, `direcciones`, `categorias`, `productos`, `pedidos`, `pagos`, `admin`, `refreshtokens`

### REQ-002: Estructura de carpetas del frontend con FSD
El frontend DEBE aplicar Feature-Sliced Design (FSD). Las capas DEBEN ser: `shared`, `entities`, `features`, `widgets`, `pages`, `app`.

**Scenario: Estructura FSD correcta**
- Given: Repositorio clonado
- When: Se lista el contenido de `frontend/src/`
- Then: Existen directorios: `shared/`, `entities/`, `features/`, `widgets/`, `pages/`, `app/` y cada uno tiene un `index.ts`

### REQ-003: Archivo .env.example en backend
DEBE existir `backend/.env.example` con todas las variables requeridas para desarrollo local, incluyendo: `DATABASE_URL`, `SECRET_KEY`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `REFRESH_TOKEN_EXPIRE_DAYS`, `MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY`, `CORS_ORIGINS`.

**Scenario: .env.example contiene todas las variables**
- Given: Repositorio clonado
- When: Se abre `backend/.env.example`
- Then: Contiene al menos 7 variables de entorno con comentarios explicativos

### REQ-004: Archivo .env.example en frontend
DEBE existir `frontend/.env.example` con: `VITE_API_URL`, `VITE_MP_PUBLIC_KEY`.

**Scenario: .env.example del frontend existe**
- Given: Repositorio clonado
- When: Se abre `frontend/.env.example`
- Then: Contiene `VITE_API_URL` y `VITE_MP_PUBLIC_KEY` con valores placeholder

### REQ-005: Documentación de setup (CONTRIBUTING.md)
DEBE existir `CONTRIBUTING.md` en la raíz que guíe paso a paso: requerimientos (Python 3.11+, Node.js 18+, PostgreSQL 15+), setup backend (venv, pip install, alembic upgrade, seed), setup frontend (npm install, npm run dev), y convenciones de commits.

**Scenario: Developer sigue CONTRIBUTING.md y ambos entornos funcionan**
- Given: Developer Lee CONTRIBUTING.md
- When: Ejecuta los pasos: backend `alembic upgrade head && python -m app.db.seed`, frontend `npm install && npm run dev`
- Then: Backend está disponible en http://localhost:8000 con /docs funcional, frontend en http://localhost:5173

### REQ-006: .gitignore completo
DEBE existir `.gitignore` que excluya: `node_modules/`, `.venv/`, `.env` (no ejemplo), `__pycache__/`, `.pytest_cache/`, `dist/`, `build/`, `.DS_Store`, archivos IDE (`.vscode/`, `.idea/`).

**Scenario: .gitignore previene commit de archivos sensibles**
- Given: Developer crea `.env` y archivos de IDE
- When: Ejecuta `git status`
- Then: `.env` y archivos IDE NO aparecen como untracked

## Output Files

- `backend/` — módulos por feature  
- `frontend/src/` — estructura FSD  
- `backend/.env.example`  
- `frontend/.env.example`  
- `CONTRIBUTING.md`  
- `.gitignore` (actualizado)  
