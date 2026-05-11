"""Business logic for the Direcciones module.

Rules enforced here:
- Ownership: users can only access their own addresses (usuario_id check).
- Single default: at most ONE address can have es_predeterminada=True per user.
  Enforced atomically via a toggle-others-off before setting the new default.
- Auto-default: the very first address created for a user is forced to es_predeterminada=True.
- Delete: hard delete (model has no deleted_at column).
"""

from typing import Optional

from sqlalchemy import select, update
from sqlmodel.ext.asyncio.session import AsyncSession

from app.db.models.usuario import DireccionEntrega
from app.modules.direcciones.schemas import DireccionCreate, DireccionUpdate


class DireccionService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    async def _unset_others(self, usuario_id: int, exclude_id: Optional[int] = None) -> None:
        """Set es_predeterminada=False for all addresses of the user except exclude_id."""
        stmt = (
            update(DireccionEntrega)
            .where(
                DireccionEntrega.usuario_id == usuario_id,
                DireccionEntrega.es_predeterminada.is_(True),
            )
        )
        if exclude_id is not None:
            stmt = stmt.where(DireccionEntrega.id != exclude_id)
        await self.session.execute(stmt.values(es_predeterminada=False))

    async def _count_by_usuario(self, usuario_id: int) -> int:
        result = await self.session.execute(
            select(DireccionEntrega).where(DireccionEntrega.usuario_id == usuario_id)
        )
        return len(result.scalars().all())

    # ------------------------------------------------------------------
    # Queries
    # ------------------------------------------------------------------

    async def get_by_usuario(self, usuario_id: int) -> list[DireccionEntrega]:
        result = await self.session.execute(
            select(DireccionEntrega)
            .where(DireccionEntrega.usuario_id == usuario_id)
            .order_by(DireccionEntrega.es_predeterminada.desc(), DireccionEntrega.id)
        )
        return list(result.scalars().all())

    async def get_by_id(self, direccion_id: int, usuario_id: int) -> DireccionEntrega:
        result = await self.session.execute(
            select(DireccionEntrega).where(
                DireccionEntrega.id == direccion_id,
                DireccionEntrega.usuario_id == usuario_id,
            )
        )
        direccion = result.scalar_one_or_none()
        if direccion is None:
            raise ValueError(f"Dirección {direccion_id} no encontrada")
        return direccion

    # ------------------------------------------------------------------
    # Mutations
    # ------------------------------------------------------------------

    async def create(self, usuario_id: int, payload: DireccionCreate) -> DireccionEntrega:
        # Is this the first address? Force es_predeterminada=True.
        total = await self._count_by_usuario(usuario_id)
        force_default = total == 0

        es_predeterminada = force_default or payload.es_predeterminada

        if es_predeterminada:
            # Unset all existing defaults for this user first
            await self._unset_others(usuario_id)

        direccion = DireccionEntrega(
            usuario_id=usuario_id,
            calle=payload.calle,
            numero=payload.numero,
            departamento=payload.departamento,
            ciudad=payload.ciudad,
            provincia=payload.provincia,
            codigo_postal=payload.codigo_postal,
            pais=payload.pais,
            es_predeterminada=es_predeterminada,
        )
        self.session.add(direccion)
        await self.session.flush()
        return direccion

    async def update(
        self, direccion_id: int, usuario_id: int, payload: DireccionUpdate
    ) -> DireccionEntrega:
        direccion = await self.get_by_id(direccion_id, usuario_id)

        if payload.calle is not None:
            direccion.calle = payload.calle
        if payload.numero is not None:
            direccion.numero = payload.numero
        if payload.departamento is not None:
            direccion.departamento = payload.departamento
        if payload.ciudad is not None:
            direccion.ciudad = payload.ciudad
        if payload.provincia is not None:
            direccion.provincia = payload.provincia
        if payload.codigo_postal is not None:
            direccion.codigo_postal = payload.codigo_postal
        if payload.pais is not None:
            direccion.pais = payload.pais

        if payload.es_predeterminada is True:
            await self._unset_others(usuario_id, exclude_id=direccion_id)
            direccion.es_predeterminada = True
        elif payload.es_predeterminada is False:
            direccion.es_predeterminada = False

        self.session.add(direccion)
        await self.session.flush()
        return direccion

    async def set_default(self, direccion_id: int, usuario_id: int) -> DireccionEntrega:
        direccion = await self.get_by_id(direccion_id, usuario_id)
        await self._unset_others(usuario_id, exclude_id=direccion_id)
        direccion.es_predeterminada = True
        self.session.add(direccion)
        await self.session.flush()
        return direccion

    async def delete(self, direccion_id: int, usuario_id: int) -> None:
        direccion = await self.get_by_id(direccion_id, usuario_id)
        await self.session.delete(direccion)
        await self.session.flush()
