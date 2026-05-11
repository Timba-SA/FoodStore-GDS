"""Tests for CategoriaService: cycle detection, soft delete, CRUD validation.

Covers tasks 5.1, 5.2 and 5.3 from 02-categorias-jerarquicas.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch, call
from datetime import datetime, timezone

from app.modules.categorias.service import CategoriaService, _generate_slug, _build_tree
from app.modules.categorias.schemas import CategoriaCreate, CategoriaUpdate, CategoriaTree
from app.db.models.categoria import Categoria


# ============================================================================
# Helpers
# ============================================================================


def make_categoria(id: int, nombre: str = "Test", parent_id=None, activa=True) -> Categoria:
    cat = MagicMock(spec=Categoria)
    cat.id = id
    cat.nombre = nombre
    cat.descripcion = None
    cat.slug = nombre.lower()
    cat.imagen_url = None
    cat.activa = activa
    cat.parent_id = parent_id
    cat.deleted_at = None
    cat.created_at = datetime.now(timezone.utc)
    cat.updated_at = datetime.now(timezone.utc)
    return cat


# ============================================================================
# Unit Tests — Slug Generation
# ============================================================================


class TestSlugGeneration:
    def test_basic_slug(self):
        assert _generate_slug("Bebidas") == "bebidas"

    def test_slug_with_spaces(self):
        assert _generate_slug("Bebidas Gaseosas") == "bebidas-gaseosas"

    def test_slug_strips_special_chars(self):
        assert _generate_slug("Café & Té") == "caf-t"

    def test_slug_collapses_multiple_dashes(self):
        assert _generate_slug("  hello   world  ") == "hello-world"


# ============================================================================
# Unit Tests — Tree Builder
# ============================================================================


class TestBuildTree:
    def test_flat_categories_no_parent(self):
        cats = [make_categoria(1, "A"), make_categoria(2, "B")]
        tree = _build_tree(cats)
        assert len(tree) == 2
        assert all(isinstance(n, CategoriaTree) for n in tree)

    def test_nested_categories(self):
        parent = make_categoria(1, "Parent", parent_id=None)
        child = make_categoria(2, "Child", parent_id=1)
        tree = _build_tree([parent, child])
        assert len(tree) == 1  # Only root
        assert tree[0].id == 1
        assert len(tree[0].children) == 1
        assert tree[0].children[0].id == 2

    def test_deeply_nested(self):
        a = make_categoria(1, "A", parent_id=None)
        b = make_categoria(2, "B", parent_id=1)
        c = make_categoria(3, "C", parent_id=2)
        tree = _build_tree([a, b, c])
        assert len(tree) == 1
        assert tree[0].children[0].children[0].id == 3


# ============================================================================
# Service Tests — Cycle Detection (Task 5.1)
# ============================================================================


class TestCycleDetection:
    @pytest.mark.asyncio
    async def test_self_parent_raises(self):
        """Category cannot be its own parent."""
        session = AsyncMock()
        service = CategoriaService(session)

        existing = make_categoria(1, "Root")
        service.get_by_id = AsyncMock(return_value=existing)

        with pytest.raises(ValueError, match="cannot be its own parent"):
            await service.update(1, CategoriaUpdate(parent_id=1))

    @pytest.mark.asyncio
    async def test_descendant_as_parent_raises(self):
        """Setting a descendant as parent should be detected as a cycle."""
        session = AsyncMock()
        service = CategoriaService(session)

        # A (id=1) -> B (id=2) -> C (id=3)
        # We try to set A's parent to C, which would create a cycle.
        node_a = make_categoria(1, "A", parent_id=None)
        node_b = make_categoria(2, "B", parent_id=1)
        node_c = make_categoria(3, "C", parent_id=2)

        # get_by_id(1) returns A (category being updated)
        # get_by_id(3) returns C (proposed parent, first ancestor check)
        # get_by_id(2) returns B (C's parent)
        # get_by_id(1) returns A → cycle detected!
        service.get_by_id = AsyncMock(side_effect=[node_a, node_c, node_b, node_a])

        with pytest.raises(ValueError, match="cycle"):
            await service.update(1, CategoriaUpdate(parent_id=3))

    @pytest.mark.asyncio
    async def test_valid_reparenting_does_not_raise(self):
        """Reparenting to a node that is NOT a descendant is valid."""
        session = AsyncMock()
        service = CategoriaService(session)

        # A (id=1, no parent), C (id=3, parent=2)
        # We set _check_cycle(current_id=3, proposed_parent_id=1)
        # Walking ancestors of A: A.parent_id = None → loop ends, no cycle
        node_a = make_categoria(1, "A", parent_id=None)
        node_a.parent_id = None  # Explicitly set to None, MagicMock defaults to truthy

        service.get_by_id = AsyncMock(side_effect=[node_a])

        # Should NOT raise
        await service._check_cycle(3, 1)


# ============================================================================
# Service Tests — Soft Delete Validation (Task 5.2)
# ============================================================================


class TestSoftDelete:
    @pytest.mark.asyncio
    async def test_delete_with_active_children_raises(self):
        """Cannot soft delete a category with active children."""
        session = AsyncMock()
        service = CategoriaService(session)

        parent = make_categoria(1, "Parent")
        service.get_by_id = AsyncMock(return_value=parent)

        # Mock children count = 2, products count = 0
        children_result = MagicMock()
        children_result.scalar.return_value = 2
        products_result = MagicMock()
        products_result.scalar.return_value = 0
        session.execute = AsyncMock(side_effect=[children_result, products_result])

        with pytest.raises(ValueError, match="active sub-category"):
            await service.soft_delete(1)

    @pytest.mark.asyncio
    async def test_delete_with_active_products_raises(self):
        """Cannot soft delete a category that has products associated."""
        session = AsyncMock()
        service = CategoriaService(session)

        cat = make_categoria(1, "Electronics")
        service.get_by_id = AsyncMock(return_value=cat)

        children_result = MagicMock()
        children_result.scalar.return_value = 0
        products_result = MagicMock()
        products_result.scalar.return_value = 3
        session.execute = AsyncMock(side_effect=[children_result, products_result])

        with pytest.raises(ValueError, match="active product"):
            await service.soft_delete(1)

    @pytest.mark.asyncio
    async def test_delete_leaf_category_succeeds(self):
        """Can soft delete a category with no children and no products."""
        session = AsyncMock()
        service = CategoriaService(session)

        cat = make_categoria(1, "Leaf")
        service.get_by_id = AsyncMock(return_value=cat)

        children_result = MagicMock()
        children_result.scalar.return_value = 0
        products_result = MagicMock()
        products_result.scalar.return_value = 0
        session.execute = AsyncMock(side_effect=[children_result, products_result])
        session.flush = AsyncMock()

        await service.soft_delete(1)

        assert cat.deleted_at is not None

    @pytest.mark.asyncio
    async def test_delete_nonexistent_raises(self):
        """Deleting a non-existent category raises ValueError."""
        session = AsyncMock()
        service = CategoriaService(session)
        service.get_by_id = AsyncMock(return_value=None)

        with pytest.raises(ValueError, match="not found"):
            await service.soft_delete(999)
