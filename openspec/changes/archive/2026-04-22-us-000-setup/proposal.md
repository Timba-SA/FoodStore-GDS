## Why

Food Store requiere una infraestructura base completamente funcional antes de implementar cualquier feature de negocio (auth, catálogo, pedidos). Este change establece los cimientos: estructura de directorios, configuración de ambos entornos (backend FastAPI + PostgreSQL, frontend React + Vite), seeding de datos catalógicos (roles, estados de pedido, formas de pago), y documentación ejecutable. Sin esto, ningún endpoint funcionará.

## What Changes

- **Backend**: Estructura de carpetas por módulos feature-first, inicialización FastAPI con CORSMiddleware, configuración PostgreSQL y migraciones base de Alembic.
- **Base de datos**: Creación de esquema completo (usuarios, roles, refresh tokens, categorias, productos, ingredientes, pedidos, pagos, direcciones) y seeding de datos catalógicos.
- **Frontend**: Scaffolding React + TypeScript + Vite, estructura FSD (Feature-Sliced Design), inicialización de Axios con interceptores.
- **Configuración local**: `.env.example` en backend y frontend con variables mínimas para desarrollo.
- **Documentación**: CONTRIBUTING.md con step-by-step del setup y convenciones del proyecto.

## Capabilities

### New Capabilities

- `project-setup`: Carpetas, configuración y documentación de setup local para ambos entornos.
- `database-schema-v5`: Modelo de datos completo (ERD v5) con todas las tablas, relaciones, soft-delete y audit trail.
- `database-seeding`: Carga de datos catalógicos (roles: ADMIN/STOCK/PEDIDOS/CLIENT, estados de pedido, formas de pago).
- `fastapi-initialization`: App FastAPI con middleware, documentación OpenAPI (/docs), CORS configurado.
- `react-initialization`: App React con TypeScript, Vite, Tailwind CSS, estructura FSD base.

### Modified Capabilities

<!-- No hay specs existentes que cambien en este sprint inicial -->

## Impact

- **Backend**: Todos los módulos posteriores (auth, usuarios, productos, pedidos, pagos) dependen de la estructura y BD creadas aquí.
- **Frontend**: La estructura FSD define dónde vivirá cada nueva feature.
- **Database**: PostgreSQL 15+ requerido. Alembic controla todas las migraciones.
- **Dependencies**: FastAPI, SQLModel, Alembic, bcrypt, python-jose, slowapi, mercadopago SDK en backend. React, Vite, TanStack Query/Form, Zustand, Axios, Tailwind en frontend.
- **Breaking changes**: Ninguna (es Sprint 0).
