"""Business logic for Ingrediente CRUD.

Rules:
- nombre must be unique (case-insensitive).
- soft delete is blocked if the ingrediente has active ProductoIngrediente associations.
- get_all supports filtering by es_alergeno, include_inactive, and a search string.
"""

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import func, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.db.models.producto import Ingrediente, ProductoIngrediente
from app.modules.ingredientes.schemas import IngredienteCreate, IngredienteUpdate


class IngredienteService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    async def get_by_id(self, ingrediente_id: int) -> Optional[Ingrediente]:
        result = await self.session.execute(
            select(Ingrediente).where(
                Ingrediente.id == ingrediente_id,
                Ingrediente.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def _assert_nombre_unique(
        self, nombre: str, exclude_id: Optional[int] = None
    ) -> None:
        stmt = select(Ingrediente).where(
            func.lower(Ingrediente.nombre) == nombre.lower().strip(),
            Ingrediente.deleted_at.is_(None),
        )
        if exclude_id is not None:
            stmt = stmt.where(Ingrediente.id != exclude_id)
        result = await self.session.execute(stmt)
        if result.scalar_one_or_none():
            raise ValueError(f"Ya existe un ingrediente con el nombre '{nombre}'")

    # ------------------------------------------------------------------
    # CRUD
    # ------------------------------------------------------------------

    async def get_all(
        self,
        *,
        include_inactive: bool = False,
        solo_alergenos: bool = False,
        search: Optional[str] = None,
    ) -> list[Ingrediente]:
        stmt = select(Ingrediente)
        if not include_inactive:
            stmt = stmt.where(Ingrediente.deleted_at.is_(None))
        if solo_alergenos:
            stmt = stmt.where(Ingrediente.es_alergeno.is_(True))
        if search:
            stmt = stmt.where(
                Ingrediente.nombre.ilike(f"%{search.strip()}%")
            )
        stmt = stmt.order_by(Ingrediente.nombre)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create(self, payload: IngredienteCreate) -> Ingrediente:
        await self._assert_nombre_unique(payload.nombre)
        ingrediente = Ingrediente(
            nombre=payload.nombre.strip(),
            descripcion=payload.descripcion,
            es_alergeno=payload.es_alergeno,
        )
        self.session.add(ingrediente)
        await self.session.flush()
        await self.session.refresh(ingrediente)
        return ingrediente

    async def update(self, ingrediente_id: int, payload: IngredienteUpdate) -> Ingrediente:
        ingrediente = await self.get_by_id(ingrediente_id)
        if ingrediente is None:
            raise ValueError(f"Ingrediente {ingrediente_id} not found")

        if payload.nombre is not None:
            await self._assert_nombre_unique(payload.nombre, exclude_id=ingrediente_id)
            ingrediente.nombre = payload.nombre.strip()
        if payload.descripcion is not None:
            ingrediente.descripcion = payload.descripcion
        if payload.es_alergeno is not None:
            ingrediente.es_alergeno = payload.es_alergeno

        ingrediente.updated_at = datetime.utcnow()
        self.session.add(ingrediente)
        await self.session.flush()
        await self.session.refresh(ingrediente)
        return ingrediente

    async def soft_delete(self, ingrediente_id: int) -> None:
        ingrediente = await self.get_by_id(ingrediente_id)
        if ingrediente is None:
            raise ValueError(f"Ingrediente {ingrediente_id} not found")

        # Block deletion if associated to any product (not soft-deleted)
        assoc_result = await self.session.execute(
            select(func.count(ProductoIngrediente.id)).where(
                ProductoIngrediente.ingrediente_id == ingrediente_id,
                ProductoIngrediente.deleted_at.is_(None),
            )
        )
        assoc_count = assoc_result.scalar()
        if assoc_count and assoc_count > 0:
            raise ValueError(
                "No se puede eliminar el ingrediente porque está asociado a "
                f"{assoc_count} producto(s) activo(s)"
            )

        ingrediente.deleted_at = datetime.utcnow()
        self.session.add(ingrediente)
        await self.session.flush()
