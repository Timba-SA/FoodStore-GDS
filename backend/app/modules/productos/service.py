"""Business logic for the Productos module.

Responsibilities:
- Full CRUD with M2M sync (clear-and-replace strategy for categories/ingredients).
- Catalog filtering: search, categoria_id, price range, sin_alergenos, include_inactive.
- Stock management (add / subtract / set) with non-negative enforcement.
- Soft delete.
"""

from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.orm import selectinload
from sqlmodel.ext.asyncio.session import AsyncSession

from app.db.models.producto import (
    Ingrediente,
    Producto,
    ProductoCategoria,
    ProductoIngrediente,
)
from app.modules.productos.schemas import (
    ProductoCreate,
    ProductoStockUpdate,
    ProductoUpdate,
)


class ProductoService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _product_stmt(self):
        """Base SELECT with eager-loaded M2M relationships."""
        return (
            select(Producto)
            .options(
                selectinload(Producto.productos_categorias).selectinload(
                    ProductoCategoria.categoria
                ),
                selectinload(Producto.productos_ingredientes).selectinload(
                    ProductoIngrediente.ingrediente
                ),
            )
        )

    async def get_by_id(self, producto_id: int, include_inactive: bool = False) -> Optional[Producto]:
        stmt = self._product_stmt().where(Producto.id == producto_id)
        if not include_inactive:
            stmt = stmt.where(Producto.deleted_at.is_(None))
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def _assert_sku_unique(self, sku: str, exclude_id: Optional[int] = None) -> None:
        stmt = select(Producto).where(
            func.upper(Producto.sku) == sku.upper(),
            Producto.deleted_at.is_(None),
        )
        if exclude_id is not None:
            stmt = stmt.where(Producto.id != exclude_id)
        result = await self.session.execute(stmt)
        if result.scalar_one_or_none():
            raise ValueError(f"Ya existe un producto con el SKU '{sku}'")

    async def _sync_categorias(self, producto_id: int, categoria_ids: list[int]) -> None:
        """Clear existing category associations and recreate them."""
        await self.session.execute(
            select(ProductoCategoria)
            .where(ProductoCategoria.producto_id == producto_id)
        )
        # Delete old
        existing = await self.session.execute(
            select(ProductoCategoria).where(ProductoCategoria.producto_id == producto_id)
        )
        for row in existing.scalars().all():
            await self.session.delete(row)
        # Insert new
        for cat_id in categoria_ids:
            self.session.add(ProductoCategoria(producto_id=producto_id, categoria_id=cat_id))

    async def _sync_ingredientes(self, producto_id: int, ingrediente_ids: list[int]) -> None:
        """Clear existing ingredient associations and recreate them."""
        existing = await self.session.execute(
            select(ProductoIngrediente).where(ProductoIngrediente.producto_id == producto_id)
        )
        for row in existing.scalars().all():
            await self.session.delete(row)
        for ing_id in ingrediente_ids:
            self.session.add(ProductoIngrediente(producto_id=producto_id, ingrediente_id=ing_id))

    # ------------------------------------------------------------------
    # CRUD
    # ------------------------------------------------------------------

    async def get_all(
        self,
        *,
        include_inactive: bool = False,
        search: Optional[str] = None,
        categoria_id: Optional[int] = None,
        min_price: Optional[Decimal] = None,
        max_price: Optional[Decimal] = None,
        sin_alergenos: bool = False,
        skip: int = 0,
        limit: int = 50,
    ) -> list[Producto]:
        stmt = self._product_stmt()

        if not include_inactive:
            stmt = stmt.where(
                Producto.deleted_at.is_(None),
                Producto.activo.is_(True),
            )

        if search:
            stmt = stmt.where(Producto.nombre.ilike(f"%{search.strip()}%"))

        if min_price is not None:
            stmt = stmt.where(Producto.precio >= min_price)

        if max_price is not None:
            stmt = stmt.where(Producto.precio <= max_price)

        if categoria_id is not None:
            # Join ProductoCategoria to filter by category
            stmt = stmt.join(
                ProductoCategoria,
                ProductoCategoria.producto_id == Producto.id,
            ).where(ProductoCategoria.categoria_id == categoria_id)

        if sin_alergenos:
            # Subquery: product IDs that have at least one allergen
            alergeno_subq = (
                select(ProductoIngrediente.producto_id)
                .join(Ingrediente, Ingrediente.id == ProductoIngrediente.ingrediente_id)
                .where(
                    Ingrediente.es_alergeno.is_(True),
                    Ingrediente.deleted_at.is_(None),
                )
                .scalar_subquery()
            )
            stmt = stmt.where(
                Producto.id.not_in(alergeno_subq),
                Producto.es_alergeno.is_(False),
            )

        stmt = stmt.order_by(Producto.nombre).offset(skip).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().unique().all())

    async def create(self, payload: ProductoCreate) -> Producto:
        await self._assert_sku_unique(payload.sku)
        producto = Producto(
            nombre=payload.nombre,
            descripcion=payload.descripcion,
            precio=payload.precio,
            stock=payload.stock,
            sku=payload.sku,
            imagen_url=payload.imagen_url,
            activo=payload.activo,
            es_alergeno=payload.es_alergeno,
        )
        self.session.add(producto)
        await self.session.flush()  # get producto.id

        await self._sync_categorias(producto.id, payload.categoria_ids)
        await self._sync_ingredientes(producto.id, payload.ingrediente_ids)
        await self.session.flush()

        # Reload with relations
        result = await self.session.execute(
            self._product_stmt().where(Producto.id == producto.id)
        )
        return result.scalar_one()

    async def update(self, producto_id: int, payload: ProductoUpdate) -> Producto:
        producto = await self.get_by_id(producto_id, include_inactive=True)
        if producto is None:
            raise ValueError(f"Producto {producto_id} not found")

        if payload.sku is not None:
            await self._assert_sku_unique(payload.sku, exclude_id=producto_id)
            producto.sku = payload.sku
        if payload.nombre is not None:
            producto.nombre = payload.nombre
        if payload.descripcion is not None:
            producto.descripcion = payload.descripcion
        if payload.precio is not None:
            producto.precio = payload.precio
        if payload.stock is not None:
            producto.stock = payload.stock
        if payload.imagen_url is not None:
            producto.imagen_url = payload.imagen_url
        if payload.activo is not None:
            producto.activo = payload.activo
            if payload.activo:
                producto.deleted_at = None
        if payload.es_alergeno is not None:
            producto.es_alergeno = payload.es_alergeno

        producto.updated_at = datetime.utcnow()
        self.session.add(producto)
        await self.session.flush()

        if payload.categoria_ids is not None:
            await self._sync_categorias(producto_id, payload.categoria_ids)
        if payload.ingrediente_ids is not None:
            await self._sync_ingredientes(producto_id, payload.ingrediente_ids)

        await self.session.flush()

        # Reload with relations
        result = await self.session.execute(
            self._product_stmt().where(Producto.id == producto_id)
        )
        return result.scalar_one()

    async def update_stock(self, producto_id: int, payload: ProductoStockUpdate) -> Producto:
        producto = await self.get_by_id(producto_id, include_inactive=True)
        if producto is None:
            raise ValueError(f"Producto {producto_id} not found")

        if payload.operacion == "set":
            new_stock = payload.cantidad
        elif payload.operacion == "add":
            new_stock = producto.stock + payload.cantidad
        else:  # subtract
            new_stock = producto.stock - payload.cantidad

        if new_stock < 0:
            raise ValueError(
                f"Stock insuficiente. Stock actual: {producto.stock}, "
                f"a substraer: {payload.cantidad}"
            )

        producto.stock = new_stock
        producto.updated_at = datetime.utcnow()
        self.session.add(producto)
        await self.session.flush()

        # Reload with relations
        result = await self.session.execute(
            self._product_stmt().where(Producto.id == producto_id)
        )
        return result.scalar_one()

    async def soft_delete(self, producto_id: int) -> None:
        producto = await self.get_by_id(producto_id)
        if producto is None:
            raise ValueError(f"Producto {producto_id} not found")

        producto.deleted_at = datetime.utcnow()
        producto.activo = False
        self.session.add(producto)
        await self.session.flush()
