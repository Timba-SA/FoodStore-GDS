"""
MetricsService — Business metrics aggregation using SQLAlchemy ORM.

All queries run as async. No raw SQL — keeps type safety.
"""

from datetime import date, datetime, timedelta, timezone
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.db.models.pedido import Pedido, Pago, DetallePedido, EstadoPedido
from app.db.models.producto import Producto
from app.modules.admin.schemas import (
    DashboardMetrics,
    TopProducto,
    VentaDelDia,
    EstadoPedidoCount,
)


class MetricsService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_dashboard(self) -> DashboardMetrics:
        """KPI summary: total orders, revenue, today's metrics, and top product."""
        # Total pedidos (all time, non-deleted)
        total_pedidos_r = await self.session.execute(
            select(func.count(Pedido.id)).where(Pedido.deleted_at.is_(None))
        )
        total_pedidos = total_pedidos_r.scalar() or 0

        # Total ingresos (sum of approved payments)
        total_ingresos_r = await self.session.execute(
            select(func.coalesce(func.sum(Pago.monto), 0)).where(
                Pago.mp_status == "approved",
                Pago.deleted_at.is_(None),
            )
        )
        total_ingresos = float(total_ingresos_r.scalar() or 0)

        # Today boundaries (UTC)
        today_start = datetime.now(timezone.utc).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        today_end = today_start + timedelta(days=1)

        pedidos_hoy_r = await self.session.execute(
            select(func.count(Pedido.id)).where(
                Pedido.deleted_at.is_(None),
                Pedido.created_at >= today_start,
                Pedido.created_at < today_end,
            )
        )
        pedidos_hoy = pedidos_hoy_r.scalar() or 0

        ingresos_hoy_r = await self.session.execute(
            select(func.coalesce(func.sum(Pago.monto), 0)).where(
                Pago.mp_status == "approved",
                Pago.deleted_at.is_(None),
                Pago.created_at >= today_start,
                Pago.created_at < today_end,
            )
        )
        ingresos_hoy = float(ingresos_hoy_r.scalar() or 0)

        # Top product (most units sold across all approved orders)
        top_r = await self.session.execute(
            select(
                Producto.nombre,
                func.sum(DetallePedido.cantidad).label("total_qty"),
            )
            .join(DetallePedido, DetallePedido.producto_id == Producto.id)
            .join(Pedido, Pedido.id == DetallePedido.pedido_id)
            .join(Pago, Pago.pedido_id == Pedido.id)
            .where(Pago.mp_status == "approved")
            .group_by(Producto.id, Producto.nombre)
            .order_by(func.sum(DetallePedido.cantidad).desc())
            .limit(1)
        )
        top_row = top_r.first()
        top_producto: Optional[TopProducto] = (
            TopProducto(nombre=top_row[0], cantidad=int(top_row[1])) if top_row else None
        )

        return DashboardMetrics(
            total_pedidos=total_pedidos,
            total_ingresos=total_ingresos,
            pedidos_hoy=pedidos_hoy,
            ingresos_hoy=ingresos_hoy,
            top_producto=top_producto,
        )

    async def get_ventas(self, dias: int = 7) -> list[VentaDelDia]:
        """Daily revenue for the last N days (approved payments only)."""
        results = []
        today = datetime.now(timezone.utc).date()
        for i in range(dias - 1, -1, -1):
            day = today - timedelta(days=i)
            day_start = datetime(day.year, day.month, day.day, tzinfo=timezone.utc)
            day_end = day_start + timedelta(days=1)

            r = await self.session.execute(
                select(func.coalesce(func.sum(Pago.monto), 0)).where(
                    Pago.mp_status == "approved",
                    Pago.deleted_at.is_(None),
                    Pago.created_at >= day_start,
                    Pago.created_at < day_end,
                )
            )
            ingresos = float(r.scalar() or 0)
            results.append(VentaDelDia(fecha=day.isoformat(), ingresos=ingresos))

        return results

    async def get_productos_top(self, limit: int = 5) -> list[TopProducto]:
        """Top N products by units sold (all approved orders)."""
        r = await self.session.execute(
            select(
                Producto.nombre,
                func.sum(DetallePedido.cantidad).label("total_qty"),
            )
            .join(DetallePedido, DetallePedido.producto_id == Producto.id)
            .join(Pedido, Pedido.id == DetallePedido.pedido_id)
            .join(Pago, Pago.pedido_id == Pedido.id)
            .where(Pago.mp_status == "approved")
            .group_by(Producto.id, Producto.nombre)
            .order_by(func.sum(DetallePedido.cantidad).desc())
            .limit(limit)
        )
        return [TopProducto(nombre=row[0], cantidad=int(row[1])) for row in r.all()]

    async def get_estados_pedidos(self) -> list[EstadoPedidoCount]:
        """Count of orders per status (all non-deleted orders)."""
        r = await self.session.execute(
            select(
                EstadoPedido.nombre,
                func.count(Pedido.id).label("cantidad"),
            )
            .join(Pedido, Pedido.estado_id == EstadoPedido.id)
            .where(Pedido.deleted_at.is_(None))
            .group_by(EstadoPedido.nombre)
            .order_by(func.count(Pedido.id).desc())
        )
        return [EstadoPedidoCount(estado=row[0], cantidad=int(row[1])) for row in r.all()]
