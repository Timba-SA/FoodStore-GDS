# Spec: database-schema-v5

## Overview
Este spec define el esquema completo de PostgreSQL para Food Store: todas las tablas, columnas, tipos, restricciones, relaciones, índices y patrones (soft delete, audit trail, snapshots). Es la versión 5 del ERD, incorporando todas las correcciones de auditoría.

## Requirements

### REQ-001: Dominio de Identidad y Acceso
La BD DEBE incluir las tablas: `Usuario`, `Rol`, `UsuarioRol`, `RefreshToken`, `DireccionEntrega`.

**Scenario: Tablas de identidad existen con columnas correctas**
- Given: Alembic migrate ejecutado
- When: Se consulta `\d usuario` en PostgreSQL
- Then: Existen columnas: `id` (BIGSERIAL PK), `nombre` (VARCHAR), `email` (VARCHAR UQ), `password_hash` (CHAR 60), `telefono` (VARCHAR NULL), `creado_en` (TIMESTAMPTZ), `actualizado_en` (TIMESTAMPTZ), `eliminado_en` (TIMESTAMPTZ NULL)

**Scenario: RefreshToken está en tabla separada con revocation**
- Given: Alembic migrate ejecutado
- When: Se consulta `\d refresh_token`
- Then: Existen columnas: `id` (BIGSERIAL PK), `token_hash` (CHAR 64 UQ), `usuario_id` (BIGINT FK), `expires_at` (TIMESTAMPTZ), `revocado_en` (TIMESTAMPTZ NULL)

### REQ-002: Dominio de Catálogo
La BD DEBE incluir: `Categoria` (con autorreferencia parent_id), `Producto`, `Ingrediente` (con es_alergeno), `ProductoCategoria` (pivot N:M), `ProductoIngrediente` (pivot N:M con es_removible), `FormaPago`.

**Scenario: Categoria soporta jerarquía**
- Given: Alembic migrate ejecutado
- When: Se consulta `\d categoria`
- Then: Existe columna `padre_id` (BIGINT FK self-ref NULL)

**Scenario: Producto incluye stock y disponibilidad**
- Given: Alembic migrate ejecutado
- When: Se consulta `\d producto`
- Then: Existen columnas: `precio_base` (DECIMAL 10,2), `stock_cantidad` (INTEGER ≥ 0), `disponible` (BOOLEAN default true)

**Scenario: Ingrediente marca alérgenos**
- Given: Alembic migrate ejecutado
- When: Se consulta `\d ingrediente`
- Then: Existe columna `es_alergeno` (BOOLEAN default false)

### REQ-003: Dominio de Ventas, Pagos y Trazabilidad
La BD DEBE incluir: `EstadoPedido` (catálogo con es_terminal), `Pedido` (con snapshots), `DetallePedido` (con precio_snapshot, nombre_snapshot, personalizacion INTEGER[]), `HistorialEstadoPedido` (append-only), `Pago` (con mp_payment_id, mp_status, idempotency_key).

**Scenario: Pedido captura snapshots de dirección y detalles**
- Given: Alembic migrate ejecutado
- When: Se consulta `\d pedido`
- Then: Existen columnas: `total` (DECIMAL 10,2), `costo_envio` (DECIMAL 10,2), `direccion_snapshot` (JSON o TEXT serializado), `creado_en`, `actualizado_en`

**Scenario: HistorialEstadoPedido es append-only**
- Given: Alembic migrate ejecutado
- When: Se consulta `\d historial_estado_pedido`
- Then: Existen columnas: `estado_desde` (VARCHAR NULL), `estado_nuevo` (VARCHAR), `usuario_id` (BIGINT NULL), `observacion` (TEXT NULL), `creado_en` (TIMESTAMPTZ)

**Scenario: Pago incluye referencias de idempotencia**
- Given: Alembic migrate ejecutado
- When: Se consulta `\d pago`
- Then: Existen columnas: `mp_payment_id` (BIGINT UQ NULL), `mp_status` (VARCHAR), `external_reference` (VARCHAR UQ), `idempotency_key` (VARCHAR UQ)

### REQ-004: Soft Delete en todas las entidades
Todas las tablas de negocio (usuario, categorias, productos, pedidos) DEBEN tener columna `eliminado_en` (TIMESTAMPTZ NULL). Cuando es NULL, el registro está activo. Cuando tiene valor, está eliminado lógicamente.

**Scenario: Soft delete previene orphans**
- Given: Un usuario tiene direcciones asociadas
- When: Se ejecuta UPDATE usuario SET eliminado_en = NOW() WHERE id = X
- Then: El usuario está marcado como eliminado pero sus direcciones persisten, con soft delete cascada controlada

### REQ-005: Índices para performance
Deben existir índices en: `usuario.email`, `refresh_token.usuario_id`, `producto.disponible`, `pedido.usuario_id`, `pedido.estado_codigo`, `detalle_pedido.pedido_id`.

**Scenario: Índices existen**
- Given: Alembic migrate ejecutado
- When: Se consulta `SELECT indexname FROM pg_indexes WHERE tablename = 'usuario'`
- Then: Existe índice en `email`

## Output Files

- Migraciones Alembic en `backend/app/db/migrations/versions/`
- `backend/app/models/` con todas las clases SQLModel
