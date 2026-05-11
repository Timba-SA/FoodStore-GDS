"""Router for the Categorias module.

Endpoints:
    GET    /api/v1/categorias          - List categories (flat or tree)
    GET    /api/v1/categorias/{id}     - Get single category
    POST   /api/v1/categorias          - Create (ADMIN | STOCK)
    PUT    /api/v1/categorias/{id}     - Update (ADMIN | STOCK)
    DELETE /api/v1/categorias/{id}     - Soft delete (ADMIN | STOCK)
"""

from typing import Optional, Union
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.modules.auth.router import require_role
from app.modules.categorias.schemas import CategoriaCreate, CategoriaResponse, CategoriaTree, CategoriaUpdate
from app.modules.categorias.service import CategoriaService

router = APIRouter(prefix="/categorias", tags=["categorias"])

_WRITE_ROLES = ["admin", "stock"]


@router.get(
    "",
    response_model=Union[list[CategoriaTree], list[CategoriaResponse]],
    status_code=status.HTTP_200_OK,
    summary="List categories",
    description="Return all active categories. Pass `tree=true` to get hierarchical structure.",
)
async def list_categorias(
    tree: bool = Query(default=False, description="Return as nested tree"),
    include_inactive: bool = Query(default=False, description="Include inactive categories"),
    session: AsyncSession = Depends(get_db),
) -> Union[list[CategoriaTree], list[CategoriaResponse]]:
    service = CategoriaService(session)
    if tree:
        return await service.get_tree(include_inactive=include_inactive)
    categories = await service.get_all(include_inactive=include_inactive)
    return [
        CategoriaResponse(
            id=c.id,
            nombre=c.nombre,
            descripcion=c.descripcion,
            slug=c.slug,
            imagen_url=c.imagen_url,
            activa=c.activa,
            parent_id=c.parent_id,
            creado_en=c.created_at,
            actualizado_en=c.updated_at,
        )
        for c in categories
    ]


@router.get(
    "/{categoria_id}",
    response_model=CategoriaResponse,
    status_code=status.HTTP_200_OK,
    summary="Get category by ID",
)
async def get_categoria(
    categoria_id: int,
    session: AsyncSession = Depends(get_db),
) -> CategoriaResponse:
    service = CategoriaService(session)
    categoria = await service.get_by_id(categoria_id)
    if categoria is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "not_found", "message": f"Category {categoria_id} not found"},
        )
    return CategoriaResponse(
        id=categoria.id,
        nombre=categoria.nombre,
        descripcion=categoria.descripcion,
        slug=categoria.slug,
        imagen_url=categoria.imagen_url,
        activa=categoria.activa,
        parent_id=categoria.parent_id,
        creado_en=categoria.created_at,
        actualizado_en=categoria.updated_at,
    )


@router.post(
    "",
    response_model=CategoriaResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create category",
    dependencies=[Depends(require_role(_WRITE_ROLES))],
)
async def create_categoria(
    data: CategoriaCreate,
    session: AsyncSession = Depends(get_db),
) -> CategoriaResponse:
    service = CategoriaService(session)
    try:
        categoria = await service.create(data)
        await session.commit()
        return CategoriaResponse(
            id=categoria.id,
            nombre=categoria.nombre,
            descripcion=categoria.descripcion,
            slug=categoria.slug,
            imagen_url=categoria.imagen_url,
            activa=categoria.activa,
            parent_id=categoria.parent_id,
            creado_en=categoria.created_at,
            actualizado_en=categoria.updated_at,
        )
    except ValueError as exc:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "validation_error", "message": str(exc)},
        )
    except Exception:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "server_error", "message": "Failed to create category"},
        )


@router.put(
    "/{categoria_id}",
    response_model=CategoriaResponse,
    status_code=status.HTTP_200_OK,
    summary="Update category",
    dependencies=[Depends(require_role(_WRITE_ROLES))],
)
async def update_categoria(
    categoria_id: int,
    data: CategoriaUpdate,
    session: AsyncSession = Depends(get_db),
) -> CategoriaResponse:
    service = CategoriaService(session)
    try:
        categoria = await service.update(categoria_id, data)
        await session.commit()
        return CategoriaResponse(
            id=categoria.id,
            nombre=categoria.nombre,
            descripcion=categoria.descripcion,
            slug=categoria.slug,
            imagen_url=categoria.imagen_url,
            activa=categoria.activa,
            parent_id=categoria.parent_id,
            creado_en=categoria.created_at,
            actualizado_en=categoria.updated_at,
        )
    except ValueError as exc:
        await session.rollback()
        err = str(exc)
        status_code = status.HTTP_404_NOT_FOUND if "not found" in err else status.HTTP_400_BAD_REQUEST
        raise HTTPException(
            status_code=status_code,
            detail={"error": "validation_error", "message": err},
        )
    except Exception:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "server_error", "message": "Failed to update category"},
        )


@router.delete(
    "/{categoria_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Soft delete category",
    dependencies=[Depends(require_role(_WRITE_ROLES))],
)
async def delete_categoria(
    categoria_id: int,
    session: AsyncSession = Depends(get_db),
) -> None:
    service = CategoriaService(session)
    try:
        await service.soft_delete(categoria_id)
        await session.commit()
    except ValueError as exc:
        await session.rollback()
        err = str(exc)
        status_code = status.HTTP_404_NOT_FOUND if "not found" in err else status.HTTP_400_BAD_REQUEST
        raise HTTPException(
            status_code=status_code,
            detail={"error": "validation_error", "message": err},
        )
    except Exception:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "server_error", "message": "Failed to delete category"},
        )
