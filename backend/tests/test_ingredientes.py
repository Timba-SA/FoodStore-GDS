"""Tests for IngredienteService: unique name, soft delete, and filtering.

Covers tasks 5.1, 5.2 and 5.3 from 02-ingredientes-alergenos.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock
from datetime import datetime, timezone

from app.modules.ingredientes.service import IngredienteService
from app.modules.ingredientes.schemas import IngredienteCreate, IngredienteUpdate
from app.db.models.producto import Ingrediente


# ============================================================================
# Helpers
# ============================================================================

def make_ingrediente(
    id: int,
    nombre: str = "Gluten",
    es_alergeno: bool = False,
    deleted_at=None,
) -> Ingrediente:
    ing = MagicMock(spec=Ingrediente)
    ing.id = id
    ing.nombre = nombre
    ing.descripcion = None
    ing.es_alergeno = es_alergeno
    ing.deleted_at = deleted_at
    ing.created_at = datetime.now(timezone.utc)
    ing.updated_at = datetime.now(timezone.utc)
    return ing


# ============================================================================
# Task 5.1 — Unique name validation
# ============================================================================


class TestUniqueNameValidation:
    @pytest.mark.asyncio
    async def test_create_duplicate_name_raises(self):
        """Creating an ingredient with an existing name should raise ValueError."""
        session = AsyncMock()
        service = IngredienteService(session)

        # _assert_nombre_unique finds an existing record
        existing = make_ingrediente(1, "Gluten")
        scalar_mock = MagicMock()
        scalar_mock.scalar_one_or_none.return_value = existing
        session.execute = AsyncMock(return_value=scalar_mock)

        with pytest.raises(ValueError, match="Ya existe"):
            await service._assert_nombre_unique("Gluten")

    @pytest.mark.asyncio
    async def test_create_unique_name_does_not_raise(self):
        """Creating an ingredient with a brand-new name should succeed the uniqueness check."""
        session = AsyncMock()
        service = IngredienteService(session)

        # No existing record found
        scalar_mock = MagicMock()
        scalar_mock.scalar_one_or_none.return_value = None
        session.execute = AsyncMock(return_value=scalar_mock)

        # Should NOT raise
        await service._assert_nombre_unique("Maní")

    @pytest.mark.asyncio
    async def test_update_name_excludes_self(self):
        """Updating an ingredient's own name should not consider itself a duplicate."""
        session = AsyncMock()
        service = IngredienteService(session)

        # Return None → the only match is the ingredient itself (excluded by id)
        scalar_mock = MagicMock()
        scalar_mock.scalar_one_or_none.return_value = None
        session.execute = AsyncMock(return_value=scalar_mock)

        # Should NOT raise (exclude_id=1)
        await service._assert_nombre_unique("Gluten", exclude_id=1)


# ============================================================================
# Task 5.2 — Soft Delete
# ============================================================================


class TestSoftDelete:
    @pytest.mark.asyncio
    async def test_delete_with_active_associations_raises(self):
        """Cannot delete an ingredient that is associated to active products."""
        session = AsyncMock()
        service = IngredienteService(session)

        ing = make_ingrediente(1, "Gluten", es_alergeno=True)
        service.get_by_id = AsyncMock(return_value=ing)

        # First execute = get_by_id (handled by mock above)
        # Second execute = count of ProductoIngrediente associations
        assoc_count_result = MagicMock()
        assoc_count_result.scalar.return_value = 3
        session.execute = AsyncMock(return_value=assoc_count_result)

        with pytest.raises(ValueError, match="asociado a"):
            await service.soft_delete(1)

    @pytest.mark.asyncio
    async def test_delete_without_associations_succeeds(self):
        """Can delete an ingredient with no active product associations."""
        session = AsyncMock()
        service = IngredienteService(session)

        ing = make_ingrediente(1, "Sal")
        service.get_by_id = AsyncMock(return_value=ing)

        assoc_count_result = MagicMock()
        assoc_count_result.scalar.return_value = 0
        session.execute = AsyncMock(return_value=assoc_count_result)
        session.flush = AsyncMock()

        await service.soft_delete(1)
        assert ing.deleted_at is not None

    @pytest.mark.asyncio
    async def test_delete_nonexistent_raises(self):
        """Deleting a non-existent ingredient raises ValueError."""
        session = AsyncMock()
        service = IngredienteService(session)
        service.get_by_id = AsyncMock(return_value=None)

        with pytest.raises(ValueError, match="not found"):
            await service.soft_delete(999)


# ============================================================================
# Task 5.3 — Filtering in get_all
# ============================================================================


class TestGetAllFiltering:
    @pytest.mark.asyncio
    async def test_get_all_returns_active_by_default(self):
        """get_all should only return active ingredients by default."""
        session = AsyncMock()
        service = IngredienteService(session)

        gluten = make_ingrediente(1, "Gluten", es_alergeno=True)
        sal = make_ingrediente(2, "Sal")
        result_mock = MagicMock()
        result_mock.scalars.return_value.all.return_value = [gluten, sal]
        session.execute = AsyncMock(return_value=result_mock)

        results = await service.get_all()
        assert len(results) == 2

    @pytest.mark.asyncio
    async def test_get_all_solo_alergenos_filters_correctly(self):
        """When solo_alergenos=True, the query should filter by es_alergeno."""
        session = AsyncMock()
        service = IngredienteService(session)

        gluten = make_ingrediente(1, "Gluten", es_alergeno=True)
        result_mock = MagicMock()
        result_mock.scalars.return_value.all.return_value = [gluten]
        session.execute = AsyncMock(return_value=result_mock)

        results = await service.get_all(solo_alergenos=True)
        assert len(results) == 1
        assert results[0].es_alergeno is True

    @pytest.mark.asyncio
    async def test_get_all_with_search_filters_by_name(self):
        """When search is provided, get_all should return matching ingredients."""
        session = AsyncMock()
        service = IngredienteService(session)

        mani = make_ingrediente(3, "Maní", es_alergeno=True)
        result_mock = MagicMock()
        result_mock.scalars.return_value.all.return_value = [mani]
        session.execute = AsyncMock(return_value=result_mock)

        results = await service.get_all(search="maní")
        assert len(results) == 1
        assert results[0].nombre == "Maní"
