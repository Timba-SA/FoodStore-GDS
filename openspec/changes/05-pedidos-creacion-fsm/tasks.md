# Implementation Tasks: 05-pedidos-creacion-fsm

## Phase 1: Database Migration
- [x] 1.1 Actualizar los modelos en `app/db/models/pedido.py` agregando `direccion_snapshot` (JSON) en `Pedido` y `personalizacion` (JSON) + `nombre_snapshot` en `DetallePedido`.
- [x] 1.2 Generar y aplicar la migración de Alembic para estos cambios. (Manual: `a1b2c3d4e5f6`)

## Phase 2: Backend Domain (Service)
- [x] 2.1 Crear `app/modules/pedidos/schemas.py` con los Pydantic models para Request y Response de pedidos.
- [x] 2.2 Crear `app/modules/pedidos/service.py` e implementar `create_pedido`. Asegurar el uso de la sesión (UoW) y `with_for_update()` para validar stock.
- [x] 2.3 Implementar `avanzar_estado` en el service. Validar la matriz de la máquina de estados. Implementar la deducción de stock atómica al pasar a `CONFIRMADO`.
- [x] 2.4 Implementar `cancelar_pedido` en el service con restauración de stock si aplicaba.
- [x] 2.5 Implementar `get_pedidos` y `get_pedido_by_id`.

## Phase 3: Backend API (Router)
- [x] 3.1 Crear `app/modules/pedidos/router.py` con los endpoints correspondientes (`POST`, `GET`, `PATCH`, `DELETE`).
- [x] 3.2 Integrar validación de roles: cliente ve sus pedidos, Admin ve todos y puede forzar cancelaciones.
- [x] 3.3 Registrar el router en `main.py`.

## Phase 4: Frontend API & Store Integration
- [x] 4.1 Crear `entities/pedido/types.ts` y `api.ts`.
- [x] 4.2 Crear `hooks.ts` con mutaciones para crear y cancelar pedidos, limpiando el `cartStore` al crear con éxito.

## Phase 5: Frontend UI (Checkout & Dashboard)
- [x] 5.1 Implementar `CheckoutModal` (integrado al `CartDrawer`) para elegir dirección de entrega y forma de pago.
- [x] 5.2 Implementar `MisPedidosPage` en el dashboard del cliente.
- [x] 5.3 Implementar `PedidoDetailModal` con el detalle de items (leyendo los snapshots) y el timeline visual de `historial_estados`.

## Phase 6: Testing
- [ ] 6.1 Backend: Testear que `create_pedido` falla atómicamente si no hay stock, testeando `with_for_update()`.
- [ ] 6.2 Backend: Testear que el stock se reduce SOLO al pasar a `CONFIRMADO`.
- [ ] 6.3 Backend: Testear restauración de stock al cancelar un pedido `CONFIRMADO`.
