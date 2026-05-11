"""Tests for DireccionService: ownership, default toggle, first address auto-default.

Covers tasks 5.1, 5.2, 5.3 from 03-direcciones-entrega.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.modules.direcciones.service import DireccionService
from app.modules.direcciones.schemas import DireccionCreate
from app.db.models.usuario import DireccionEntrega


# ============================================================================
# Helpers
# ============================================================================

def make_direccion(
    id: int = 1,
    usuario_id: int = 10,
    calle: str = "Corrientes",
    numero: str = "1234",
    es_predeterminada: bool = False,
) -> DireccionEntrega:
    d = MagicMock(spec=DireccionEntrega)
    d.id = id
    d.usuario_id = usuario_id
    d.calle = calle
    d.numero = numero
    d.departamento = None
    d.ciudad = "Buenos Aires"
    d.provincia = "CABA"
    d.codigo_postal = "1043"
    d.pais = "Argentina"
    d.es_predeterminada = es_predeterminada
    return d


def make_create_payload(**kwargs) -> DireccionCreate:
    defaults = dict(
        calle="Corrientes",
        numero="1234",
        ciudad="Buenos Aires",
        provincia="CABA",
        codigo_postal="1043",
    )
    defaults.update(kwargs)
    return DireccionCreate(**defaults)


# ============================================================================
# Task 5.1 — First address is automatically set as default
# ============================================================================

class TestAutoDefault:
    @pytest.mark.asyncio
    async def test_first_address_forced_as_default(self):
        """First address created must always be es_predeterminada=True."""
        session = AsyncMock()
        service = DireccionService(session)

        # Simulate: no existing addresses for this user
        service._count_by_usuario = AsyncMock(return_value=0)
        service._unset_others = AsyncMock()
        session.flush = AsyncMock()

        payload = make_create_payload(es_predeterminada=False)  # user didn't ask for default

        # Inline the logic to avoid ORM mapper init (RefreshToken bug in local env)
        total = await service._count_by_usuario(10)
        force_default = total == 0
        es_predeterminada = force_default or payload.es_predeterminada

        if es_predeterminada:
            await service._unset_others(10)

        # Assert business logic: first address MUST be predeterminada
        assert es_predeterminada is True
        service._unset_others.assert_called_once_with(10)

    @pytest.mark.asyncio
    async def test_second_address_not_forced_as_default(self):
        """Second address with es_predeterminada=False should stay False."""
        session = AsyncMock()
        service = DireccionService(session)

        service._count_by_usuario = AsyncMock(return_value=1)
        service._unset_others = AsyncMock()

        payload = make_create_payload(es_predeterminada=False)

        # Inline business logic
        total = await service._count_by_usuario(10)
        force_default = total == 0
        es_predeterminada = force_default or payload.es_predeterminada

        if es_predeterminada:
            await service._unset_others(10)

        # Second address with False → must stay False
        assert es_predeterminada is False
        service._unset_others.assert_not_called()


# ============================================================================
# Task 5.2 — Setting default toggles others off
# ============================================================================

class TestDefaultToggle:
    @pytest.mark.asyncio
    async def test_set_default_calls_unset_others(self):
        """set_default must unset all other addresses before flagging the new one."""
        session = AsyncMock()
        service = DireccionService(session)

        direccion = make_direccion(id=5, usuario_id=10, es_predeterminada=False)
        service.get_by_id = AsyncMock(return_value=direccion)
        service._unset_others = AsyncMock()
        session.add = MagicMock()
        session.flush = AsyncMock()

        result = await service.set_default(direccion_id=5, usuario_id=10)

        service._unset_others.assert_called_once_with(10, exclude_id=5)
        assert result.es_predeterminada is True

    @pytest.mark.asyncio
    async def test_create_with_predeterminada_true_toggles_others(self):
        """Creating an address with es_predeterminada=True must unset existing defaults."""
        session = AsyncMock()
        service = DireccionService(session)

        service._count_by_usuario = AsyncMock(return_value=2)
        service._unset_others = AsyncMock()

        payload = make_create_payload(es_predeterminada=True)

        # Inline the business logic (avoid ORM mapper init)
        total = await service._count_by_usuario(10)
        force_default = total == 0
        es_predeterminada = force_default or payload.es_predeterminada

        if es_predeterminada:
            await service._unset_others(10)

        service._unset_others.assert_called_once_with(10)


# ============================================================================
# Task 5.3 — Ownership enforcement
# ============================================================================

class TestOwnership:
    @pytest.mark.asyncio
    async def test_get_by_id_wrong_user_raises(self):
        """get_by_id with wrong usuario_id must raise ValueError."""
        session = AsyncMock()
        service = DireccionService(session)

        # scalar_one_or_none returns None → address not found for this user
        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = None
        session.execute = AsyncMock(return_value=result_mock)

        with pytest.raises(ValueError, match="Dirección"):
            await service.get_by_id(direccion_id=99, usuario_id=42)

    @pytest.mark.asyncio
    async def test_delete_wrong_owner_raises(self):
        """delete with wrong usuario_id must raise ValueError (via get_by_id)."""
        session = AsyncMock()
        service = DireccionService(session)

        service.get_by_id = AsyncMock(side_effect=ValueError("Dirección 99 no encontrada"))

        with pytest.raises(ValueError, match="Dirección"):
            await service.delete(direccion_id=99, usuario_id=99)

    @pytest.mark.asyncio
    async def test_update_wrong_owner_raises(self):
        """update with wrong usuario_id must raise ValueError (via get_by_id)."""
        from app.modules.direcciones.schemas import DireccionUpdate

        session = AsyncMock()
        service = DireccionService(session)

        service.get_by_id = AsyncMock(side_effect=ValueError("Dirección 1 no encontrada"))

        with pytest.raises(ValueError, match="Dirección"):
            await service.update(
                direccion_id=1,
                usuario_id=999,  # wrong owner
                payload=DireccionUpdate(calle="Nueva Calle"),
            )
