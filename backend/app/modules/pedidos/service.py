"""
PedidoService — Business logic for order creation, FSM transitions, and cancellation.

Business rules implemented:
- RN-PE01: Atomic creation using the session as a UoW (commit only at router level).
- RN-PE02: Stock validated with SELECT FOR UPDATE (with_for_update()) to prevent race conditions.
- RN-PE03: Stock deducted ONLY at PENDIENTE → CONFIRMADO transition.
- RN-PE04: direccion_snapshot saved at creation time (US-038).
- RN-PE05: personalizacion stored as JSON integer list in each DetallePedido.
- RN-FS01-09: FSM enforces valid transitions, ENTREGADO/CANCELADO are terminal states.
- RN-RB08: Only ADMIN can cancel orders in EN_PREPARACION state.
"""

import uuid
import logging
from decimal import Decimal
from datetime import datetime
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload

from app.db.models.usuario import DireccionEntrega
from app.db.models.pedido import (
    Pedido,
    DetallePedido,
    HistorialEstadoPedido,
    EstadoPedido,
)
from app.db.models.producto import Producto
from app.modules.pedidos.schemas import PedidoCreate, CartItemPayload

logger = logging.getLogger(__name__)

# ─── FSM: valid transitions ──────────────────────────────────────────────────
# Maps current_state → set of allowed next states
FSM_TRANSITIONS: dict[str, set[str]] = {
    "pendiente":       {"confirmado", "cancelado"},
    "confirmado":      {"en_preparacion", "cancelado"},
    "en_preparacion":  {"en_camino", "cancelado"},
    "en_camino":       {"entregado"},
    "entregado":       set(),   # terminal
    "cancelado":       set(),   # terminal
}

# States from which regular clients can cancel (ADMIN can also cancel en_preparacion)
CLIENT_CANCELLABLE_STATES = {"pendiente", "confirmado"}
ADMIN_CANCELLABLE_STATES  = {"pendiente", "confirmado", "en_preparacion"}

# States that had stock deducted (must restore on cancel)
STOCK_DEDUCTED_STATES = {"confirmado", "en_preparacion", "en_camino", "entregado"}


class PedidoService:
    def __init__(self, session: AsyncSession):
        self.session = session

    # ─── Private helpers ────────────────────────────────────────────────────

    async def _get_estado(self, nombre: str) -> EstadoPedido:
        """Fetch an EstadoPedido by nombre, raise ValueError if not found."""
        result = await self.session.execute(
            select(EstadoPedido).where(EstadoPedido.nombre == nombre)
        )
        estado = result.scalars().first()
        if not estado:
            raise ValueError(f"Estado '{nombre}' no encontrado en la base de datos.")
        return estado

    async def _get_pedido(self, pedido_id: int) -> Pedido:
        """Fetch a Pedido with its relations eagerly loaded."""
        result = await self.session.execute(
            select(Pedido)
            .options(
                selectinload(Pedido.detalles_pedido),
                selectinload(Pedido.historial_estados).selectinload(HistorialEstadoPedido.estado),
                selectinload(Pedido.historial_estados),
            )
            .where(Pedido.id == pedido_id)
        )
        pedido = result.scalars().first()
        if not pedido:
            raise ValueError(f"Pedido #{pedido_id} no encontrado.")
        return pedido

    def _make_numero_pedido(self) -> str:
        """Generate a unique order number: ORD-<8 hex chars>."""
        return f"ORD-{uuid.uuid4().hex[:8].upper()}"

    async def _build_direccion_snapshot(self, direccion: DireccionEntrega) -> dict:
        """Build a JSON snapshot of the delivery address."""
        return {
            "calle": direccion.calle,
            "numero": direccion.numero,
            "departamento": direccion.departamento,
            "ciudad": direccion.ciudad,
            "provincia": direccion.provincia,
            "codigo_postal": direccion.codigo_postal,
            "pais": direccion.pais,
        }

    # ─── Public API ─────────────────────────────────────────────────────────

    async def create(
        self,
        usuario_id: int,
        payload: PedidoCreate,
    ) -> Pedido:
        """
        Create a new order atomically.
        The session is NOT committed here — the router handles commit/rollback.
        """
        # 1. Validate delivery address belongs to user
        result = await self.session.execute(
            select(DireccionEntrega).where(
                DireccionEntrega.id == payload.direccion_entrega_id,
                DireccionEntrega.usuario_id == usuario_id,
            )
        )
        direccion = result.scalars().first()
        if not direccion:
            raise ValueError("La dirección de entrega no pertenece al usuario o no existe.")

        # 2. Fetch PENDIENTE state
        estado_pendiente = await self._get_estado("pendiente")

        # 3. Validate products and calculate totals (SELECT FOR UPDATE → race condition safe)
        subtotal = Decimal("0.00")
        validated_items: list[tuple[CartItemPayload, Producto]] = []

        for item in payload.items:
            result = await self.session.execute(
                select(Producto)
                .where(Producto.id == item.producto_id)
                .with_for_update()
            )
            producto = result.scalars().first()
            if not producto:
                raise ValueError(f"Producto #{item.producto_id} no encontrado.")
            if not producto.activo:
                raise ValueError(f"El producto '{producto.nombre}' no está disponible.")
            if producto.stock < item.cantidad:
                raise ValueError(
                    f"Stock insuficiente para '{producto.nombre}'. "
                    f"Stock disponible: {producto.stock}, solicitado: {item.cantidad}."
                )
            validated_items.append((item, producto))
            subtotal += Decimal(str(producto.precio)) * item.cantidad

        total = subtotal  # No taxes / shipping for now (could extend)

        # 4. Create Pedido
        snapshot = await self._build_direccion_snapshot(direccion)
        pedido = Pedido(
            usuario_id=usuario_id,
            numero_pedido=self._make_numero_pedido(),
            estado_id=estado_pendiente.id,
            direccion_entrega_id=payload.direccion_entrega_id,
            direccion_snapshot=snapshot,
            subtotal=subtotal,
            impuestos=Decimal("0.00"),
            costo_envio=Decimal("0.00"),
            total=total,
            notas=payload.notas,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        self.session.add(pedido)
        await self.session.flush()  # Get pedido.id without committing

        # 5. Create DetallePedido records
        for item, producto in validated_items:
            precio = Decimal(str(producto.precio))
            detalle = DetallePedido(
                pedido_id=pedido.id,
                producto_id=producto.id,
                cantidad=item.cantidad,
                precio_unitario=precio,
                subtotal=precio * item.cantidad,
                nombre_snapshot=producto.nombre,
                personalizacion=item.personalizacion or [],
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            self.session.add(detalle)

        # 6. Create initial HistorialEstadoPedido (estado_desde = NULL)
        historial = HistorialEstadoPedido(
            pedido_id=pedido.id,
            estado_id=estado_pendiente.id,
            usuario_id=usuario_id,
            nota="Pedido creado",
            fecha_cambio=datetime.utcnow(),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        self.session.add(historial)

        logger.info(f"Pedido {pedido.numero_pedido} creado para usuario {usuario_id}")
        return pedido

    async def avanzar_estado(
        self,
        pedido_id: int,
        nuevo_estado_nombre: str,
        usuario_id: int,
        nota: Optional[str] = None,
    ) -> Pedido:
        """Advance the order's FSM state. Validates transition and deducts stock if needed."""
        pedido = await self._get_pedido(pedido_id)

        # Resolve current state name
        result = await self.session.execute(
            select(EstadoPedido).where(EstadoPedido.id == pedido.estado_id)
        )
        estado_actual = result.scalars().first()
        if not estado_actual:
            raise ValueError("Estado actual del pedido no encontrado.")

        # Validate FSM transition
        allowed = FSM_TRANSITIONS.get(estado_actual.nombre, set())
        if nuevo_estado_nombre not in allowed:
            raise ValueError(
                f"Transición inválida: {estado_actual.nombre} → {nuevo_estado_nombre}. "
                f"Transiciones permitidas: {allowed or 'ninguna (estado terminal)'}."
            )

        nuevo_estado = await self._get_estado(nuevo_estado_nombre)

        # If transitioning to CONFIRMADO: deduct stock atomically
        if nuevo_estado_nombre == "confirmado":
            result = await self.session.execute(
                select(DetallePedido).where(DetallePedido.pedido_id == pedido_id)
            )
            detalles = result.scalars().all()
            for detalle in detalles:
                result2 = await self.session.execute(
                    select(Producto)
                    .where(Producto.id == detalle.producto_id)
                    .with_for_update()
                )
                producto = result2.scalars().first()
                if not producto or producto.stock < detalle.cantidad:
                    pname = producto.nombre if producto else f"ID #{detalle.producto_id}"
                    raise ValueError(
                        f"Stock insuficiente para confirmar el pedido. "
                        f"Producto '{pname}' ya no tiene suficiente stock."
                    )
                producto.stock -= detalle.cantidad

        # Update pedido state
        pedido.estado_id = nuevo_estado.id
        pedido.updated_at = datetime.utcnow()

        # Append-only historial entry
        historial = HistorialEstadoPedido(
            pedido_id=pedido.id,
            estado_id=nuevo_estado.id,
            usuario_id=usuario_id,
            nota=nota,
            fecha_cambio=datetime.utcnow(),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        self.session.add(historial)
        return pedido

    async def cancelar(
        self,
        pedido_id: int,
        usuario_id: int,
        is_admin: bool = False,
        nota: Optional[str] = None,
    ) -> Pedido:
        """Cancel an order. Restores stock if it was already deducted (CONFIRMADO+)."""
        pedido = await self._get_pedido(pedido_id)

        result = await self.session.execute(
            select(EstadoPedido).where(EstadoPedido.id == pedido.estado_id)
        )
        estado_actual = result.scalars().first()

        # Ownership check for non-admins
        if not is_admin and pedido.usuario_id != usuario_id:
            raise PermissionError("No tenés permiso para cancelar este pedido.")

        # Check if cancellation is allowed
        cancellable = ADMIN_CANCELLABLE_STATES if is_admin else CLIENT_CANCELLABLE_STATES
        if estado_actual.nombre not in cancellable:
            raise ValueError(
                f"El pedido no puede cancelarse en estado '{estado_actual.nombre}'."
            )

        # Restore stock if it was already deducted
        if estado_actual.nombre in STOCK_DEDUCTED_STATES:
            result2 = await self.session.execute(
                select(DetallePedido).where(DetallePedido.pedido_id == pedido_id)
            )
            detalles = result2.scalars().all()
            for detalle in detalles:
                await self.session.execute(
                    update(Producto)
                    .where(Producto.id == detalle.producto_id)
                    .values(stock=Producto.stock + detalle.cantidad)
                )

        estado_cancelado = await self._get_estado("cancelado")
        pedido.estado_id = estado_cancelado.id
        pedido.updated_at = datetime.utcnow()

        historial = HistorialEstadoPedido(
            pedido_id=pedido.id,
            estado_id=estado_cancelado.id,
            usuario_id=usuario_id,
            nota=nota or "Pedido cancelado",
            fecha_cambio=datetime.utcnow(),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        self.session.add(historial)
        return pedido

    async def get_pedidos(
        self,
        usuario_id: int,
        is_admin: bool = False,
        estado: Optional[str] = None,
    ) -> list[Pedido]:
        """List orders. Admins see all; clients see only theirs."""
        query = select(Pedido).options(
            selectinload(Pedido.historial_estados).selectinload(HistorialEstadoPedido.estado),
        )
        if not is_admin:
            query = query.where(Pedido.usuario_id == usuario_id)
        if estado:
            result_e = await self.session.execute(
                select(EstadoPedido).where(EstadoPedido.nombre == estado)
            )
            ep = result_e.scalars().first()
            if ep:
                query = query.where(Pedido.estado_id == ep.id)
        query = query.order_by(Pedido.created_at.desc())
        result = await self.session.execute(query)
        return result.scalars().all()

    async def get_by_id(self, pedido_id: int, usuario_id: int, is_admin: bool = False) -> Pedido:
        """Fetch a single order. Clients can only see their own."""
        result = await self.session.execute(
            select(Pedido)
            .options(
                selectinload(Pedido.detalles_pedido),
                selectinload(Pedido.historial_estados).selectinload(HistorialEstadoPedido.estado),
            )
            .where(Pedido.id == pedido_id)
        )
        pedido = result.scalars().first()
        if not pedido:
            raise ValueError(f"Pedido #{pedido_id} no encontrado.")
        if not is_admin and pedido.usuario_id != usuario_id:
            raise PermissionError("No tenés permiso para ver este pedido.")
        return pedido
