"""Service layer for the Categorias module.

Handles business logic:
- CRUD operations
- Cycle detection (prevent infinite hierarchy loops)
- Soft delete validation (no active children / products)
- Tree building from flat list
"""

from typing import Optional
from datetime import datetime, timezone

from sqlalchemy import select, func, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.categoria import Categoria
from app.db.models.producto import ProductoCategoria
from app.modules.categorias.schemas import CategoriaCreate, CategoriaUpdate, CategoriaTree


def _generate_slug(nombre: str) -> str:
    """Generate a URL-friendly slug from a category name."""
    import re
    slug = nombre.lower().strip()
    slug = re.sub(r"[\s_]+", "-", slug)
    slug = re.sub(r"[^a-z0-9\-]", "", slug)
    slug = re.sub(r"-+", "-", slug).strip("-")
    return slug


def _build_tree(categories: list[Categoria], parent_id: Optional[int] = None) -> list[CategoriaTree]:
    """Recursively build a tree from a flat list of categories."""
    result = []
    for cat in categories:
        if cat.parent_id == parent_id:
            children = _build_tree(categories, parent_id=cat.id)
            node = CategoriaTree(
                id=cat.id,
                nombre=cat.nombre,
                descripcion=cat.descripcion,
                slug=cat.slug,
                imagen_url=cat.imagen_url,
                activa=cat.activa,
                parent_id=cat.parent_id,
                children=children,
            )
            result.append(node)
    return result


class CategoriaService:
    """Service for managing categories with hierarchical support."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_all(self, include_inactive: bool = False) -> list[Categoria]:
        """Return all categories (optionally including inactive ones)."""
        stmt = select(Categoria).where(Categoria.deleted_at.is_(None))  # type: ignore
        if not include_inactive:
            stmt = stmt.where(Categoria.activa == True)  # noqa: E712
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_tree(self, include_inactive: bool = False) -> list[CategoriaTree]:
        """Return categories structured as a hierarchical tree."""
        categories = await self.get_all(include_inactive=include_inactive)
        return _build_tree(categories)

    async def get_by_id(self, categoria_id: int) -> Optional[Categoria]:
        """Return a single category by ID or None if not found / soft-deleted."""
        result = await self.session.execute(
            select(Categoria).where(
                Categoria.id == categoria_id,
                Categoria.deleted_at.is_(None),  # type: ignore
            )
        )
        return result.scalars().first()

    async def create(self, data: CategoriaCreate) -> Categoria:
        """Create a new category, auto-generating slug if needed."""
        # Validate parent exists and is not deleted
        if data.parent_id is not None:
            parent = await self.get_by_id(data.parent_id)
            if parent is None:
                raise ValueError(f"Parent category {data.parent_id} not found or is deleted")

        slug = data.slug or _generate_slug(data.nombre)

        categoria = Categoria(
            nombre=data.nombre,
            descripcion=data.descripcion,
            slug=slug,
            imagen_url=data.imagen_url,
            activa=data.activa,
            parent_id=data.parent_id,
        )
        self.session.add(categoria)
        await self.session.flush()
        await self.session.refresh(categoria)
        return categoria

    async def update(self, categoria_id: int, data: CategoriaUpdate) -> Categoria:
        """Update a category with cycle detection."""
        categoria = await self.get_by_id(categoria_id)
        if categoria is None:
            raise ValueError(f"Category {categoria_id} not found")

        # Cycle detection: if parent_id is being set, walk up the ancestor chain
        if data.parent_id is not None:
            if data.parent_id == categoria_id:
                raise ValueError("A category cannot be its own parent")
            await self._check_cycle(categoria_id, data.parent_id)

            # Validate new parent exists
            parent = await self.get_by_id(data.parent_id)
            if parent is None:
                raise ValueError(f"Parent category {data.parent_id} not found or is deleted")

        if data.nombre is not None:
            categoria.nombre = data.nombre
            if data.slug is None:
                categoria.slug = _generate_slug(data.nombre)
        if data.slug is not None:
            categoria.slug = data.slug
        if data.descripcion is not None:
            categoria.descripcion = data.descripcion
        if data.imagen_url is not None:
            categoria.imagen_url = data.imagen_url
        if data.activa is not None:
            categoria.activa = data.activa
        if data.parent_id is not None:
            categoria.parent_id = data.parent_id

        categoria.updated_at = datetime.now(timezone.utc)
        await self.session.flush()
        await self.session.refresh(categoria)
        return categoria

    async def soft_delete(self, categoria_id: int) -> None:
        """Soft delete a category if it has no active children or products."""
        categoria = await self.get_by_id(categoria_id)
        if categoria is None:
            raise ValueError(f"Category {categoria_id} not found")

        # Check for active children
        children_result = await self.session.execute(
            select(func.count(Categoria.id)).where(
                Categoria.parent_id == categoria_id,
                Categoria.deleted_at.is_(None),  # type: ignore
            )
        )
        children_count = children_result.scalar() or 0
        if children_count > 0:
            raise ValueError(
                f"Cannot delete category '{categoria.nombre}': it has {children_count} active sub-category(ies)"
            )

        # Check for associated active products
        products_result = await self.session.execute(
            select(func.count(ProductoCategoria.id)).where(
                ProductoCategoria.categoria_id == categoria_id,
                ProductoCategoria.deleted_at.is_(None),  # type: ignore
            )
        )
        products_count = products_result.scalar() or 0
        if products_count > 0:
            raise ValueError(
                f"Cannot delete category '{categoria.nombre}': it has {products_count} active product(s)"
            )

        categoria.deleted_at = datetime.now(timezone.utc)
        await self.session.flush()

    async def _check_cycle(self, current_id: int, proposed_parent_id: int) -> None:
        """Walk ancestor chain of proposed_parent_id to detect if current_id appears (cycle)."""
        visited_id = proposed_parent_id
        while visited_id is not None:
            ancestor = await self.get_by_id(visited_id)
            if ancestor is None:
                break
            if ancestor.id == current_id:
                raise ValueError(
                    "Cannot create a cycle: the proposed parent is a descendant of the current category"
                )
            visited_id = ancestor.parent_id
