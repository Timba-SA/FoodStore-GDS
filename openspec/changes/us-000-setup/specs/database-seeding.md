# Spec: database-seeding

## Overview
Este spec define qué datos catalógicos DEBEN cargarse automáticamente durante el setup local (`python -m app.db.seed`). Estos datos son precondiciones para que el sistema funcione: sin roles no hay autorización, sin estados de pedido no hay máquina de estados, sin formas de pago no hay checkout.

## Requirements

### REQ-001: Seeding de Roles
El seed DEBE crear exactamente 4 roles: `ADMIN`, `STOCK`, `PEDIDOS`, `CLIENT`.

**Scenario: Roles existen después del seed**
- Given: `alembic upgrade head` completado
- When: Se ejecuta `python -m app.db.seed`
- Then: La tabla `rol` contiene exactamente 4 registros con `codigo` = ADMIN, STOCK, PEDIDOS, CLIENT

**Scenario: ADMIN tiene descripción**
- Given: Seed ejecutado
- When: Se consulta `SELECT * FROM rol WHERE codigo = 'ADMIN'`
- Then: Existe descripción: "Acceso total al sistema"

### REQ-002: Seeding de Estados de Pedido
El seed DEBE crear exactamente 6 estados: `PENDIENTE`, `CONFIRMADO`, `EN_PREPARACIÓN`, `EN_CAMINO`, `ENTREGADO`, `CANCELADO`.

**Scenario: Estados de pedido existen**
- Given: Seed ejecutado
- When: Se consulta `SELECT COUNT(*) FROM estado_pedido`
- Then: Retorna 6

**Scenario: Estados terminales están marcados**
- Given: Seed ejecutado
- When: Se consulta `SELECT codigo FROM estado_pedido WHERE es_terminal = true`
- Then: Retorna: ENTREGADO, CANCELADO

### REQ-003: Seeding de Formas de Pago
El seed DEBE crear formas de pago: `MERCADOPAGO` (habilitada), `EFECTIVO` (habilitada), `TRANSFERENCIA` (habilitada).

**Scenario: Formas de pago existen y están habilitadas**
- Given: Seed ejecutado
- When: Se consulta `SELECT codigo FROM forma_pago WHERE habilitado = true`
- Then: Retorna: MERCADOPAGO, EFECTIVO, TRANSFERENCIA

### REQ-004: Seeding de Usuario Administrador
El seed DEBE crear un usuario ADMIN de prueba: email=`admin@foodstore.local`, nombre=`Admin`, contraseña hasheada (ejemplo: bcrypt de `admin123`), rol ADMIN asignado.

**Scenario: Admin user existe y puede loguearse**
- Given: Seed ejecutado
- When: POST /api/v1/auth/login con {"email": "admin@foodstore.local", "password": "admin123"}
- Then: Retorna 200 con tokens y roles=[ADMIN]

### REQ-005: Script de seed idempotente
El seed MUST ser idempotente: ejecutarlo dos veces NO debe crear duplicados.

**Scenario: Ejecutar seed dos veces mantiene integridad**
- Given: Seed ejecutado una vez
- When: Se ejecuta nuevamente `python -m app.db.seed`
- Then: No hay errores de integridad y COUNT(*) de cada tabla coincide con la ejecución anterior

## Output Files

- `backend/app/db/seed.py` — script ejecutable con `python -m app.db.seed`
