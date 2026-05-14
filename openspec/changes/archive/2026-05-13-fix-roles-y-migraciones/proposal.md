# Proposal: fix/roles-y-migraciones

**ID**: fix/roles-y-migraciones  
**Épica**: Foundations / Infraestructura  
**Prioridad**: Crítica (bloqueante)  
**Fecha**: 2026-05-13  
**Estado**: Aprobado → En implementación

---

## Problema

El proyecto tiene dos bugs críticos que bloquean cualquier test de integración:

### Bug 1 — Roles inconsistentes (RBAC roto en runtime)

El código define y usa roles `admin, customer, seller, moderator` (inglés), pero:
- El `CHANGES.md` especifica los roles del dominio como `ADMIN, STOCK, PEDIDOS, CLIENT`
- Los routers protegen endpoints con `["admin", "stock"]` — `stock` **nunca se crea** en seed
- El `auth/service.py` asigna rol `"customer"` al registrar — tampoco coincide con el dominio

Resultado: cualquier usuario registrado NO puede acceder a rutas de `stock`, `pedidos` ni funcionalidades admin reales.

### Bug 2 — Sin migraciones Alembic

El directorio `alembic/versions/` no existe. Los modelos están completos (16 tablas) pero no hay ninguna migración generada. Sin migraciones:
- La DB no puede crearse correctamente en Docker
- `alembic upgrade head` falla
- El seed.py tampoco puede correr (las tablas no existen)

---

## Solución

1. **Unificar roles** a `admin, stock, pedidos, client` (minúscula, domain-driven)
2. **Actualizar `RolEnum`** para reflejar los 4 roles reales
3. **Actualizar `seed.py`** para crear los 4 roles correctos + admin user
4. **Actualizar `auth/service.py`** para asignar `"client"` en registro
5. **Crear migración inicial** con `alembic revision --autogenerate`

---

## Fuera de scope

- No cambiar lógica de negocio
- No tocar frontend (roles ya en minúscula, compatibles)
- No agregar nuevos endpoints
