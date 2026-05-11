"""Router for the Productos module.

Endpoints:
    GET    /api/v1/productos               - Public catalog (available only) / admin (include_inactive)
    GET    /api/v1/productos/{id}          - Get product with categories and ingredients
    POST   /api/v1/productos               - Create product (ADMIN | STOCK)
    PUT    /api/v1/productos/{id}          - Update product + M2M (ADMIN | STOCK)
    PATCH  /api/v1/productos/{id}/stock    - Adjust stock (ADMIN | STOCK)
    DELETE /api/v1/productos/{id}          - Soft delete (ADMIN | STOCK)
"""

from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.modules.auth.router import require_role
from app.modules.productos.schemas import (
    ProductoCreate,
    ProductoResponse,
    ProductoStockUpdate,
    ProductoUpdate,
)
from app.modules.productos.service import ProductoService

router = APIRouter(prefix="/productos", tags=["productos"])

_WRITE_ROLES = ["admin", "stock"]


def _to_response(producto) -> ProductoResponse:
    """Map ORM Producto (with loaded relations) → ProductoResponse."""
    return ProductoResponse(
        id=producto.id,
        nombre=producto.nombre,
        descripcion=producto.descripcion,
        precio=producto.precio,
        stock=producto.stock,
        sku=producto.sku,
        imagen_url=producto.imagen_url,
        activo=producto.activo,
        deleted_at=producto.deleted_at,
        created_at=producto.created_at,
        updated_at=producto.updated_at,
        categorias=[
            {"id": pc.categoria.id, "nombre": pc.categoria.nombre, "slug": pc.categoria.slug, "imagen_url": pc.categoria.imagen_url}
            for pc in producto.productos_categorias
            if pc.categoria is not None and pc.categoria.deleted_at is None
        ],
        ingredientes=[
            {"id": pi.ingrediente.id, "nombre": pi.ingrediente.nombre, "es_alergeno": pi.ingrediente.es_alergeno}
            for pi in producto.productos_ingredientes
            if pi.ingrediente is not None and pi.ingrediente.deleted_at is None
        ],
    )


@router.get(
    "",
    response_model=list[ProductoResponse],
    status_code=status.HTTP_200_OK,
    summary="List products (catalog)",
)
async def list_productos(
    search: Optional[str] = Query(default=None, description="Name search (ILIKE)"),
    categoria_id: Optional[int] = Query(default=None, description="Filter by category"),
    min_price: Optional[Decimal] = Query(default=None, ge=0, description="Min price"),
    max_price: Optional[Decimal] = Query(default=None, ge=0, description="Max price"),
    sin_alergenos: bool = Query(default=False, description="Exclude products with allergens"),
    include_inactive: bool = Query(default=False, description="Include inactive/deleted (requires ADMIN/STOCK)"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    session: AsyncSession = Depends(get_db),
) -> list[ProductoResponse]:
    service = ProductoService(session)
    productos = await service.get_all(
        include_inactive=False,  # public endpoint — always filters to active only
        search=search,
        categoria_id=categoria_id,
        min_price=min_price,
        max_price=max_price,
        sin_alergenos=sin_alergenos,
        skip=skip,
        limit=limit,
    )
    return [_to_response(p) for p in productos]


@router.get(
    "/{producto_id}",
    response_model=ProductoResponse,
    status_code=status.HTTP_200_OK,
    summary="Get product by ID",
)
async def get_producto(
    producto_id: int,
    session: AsyncSession = Depends(get_db),
) -> ProductoResponse:
    service = ProductoService(session)
    producto = await service.get_by_id(producto_id)
    if producto is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "not_found", "message": f"Producto {producto_id} not found"},
        )
    return _to_response(producto)


@router.post(
    "",
    response_model=ProductoResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create product",
    dependencies=[Depends(require_role(_WRITE_ROLES))],
)
async def create_producto(
    data: ProductoCreate,
    session: AsyncSession = Depends(get_db),
) -> ProductoResponse:
    service = ProductoService(session)
    try:
        producto = await service.create(data)
        await session.commit()
        return _to_response(producto)
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
            detail={"error": "server_error", "message": "Failed to create product"},
        )


@router.put(
    "/{producto_id}",
    response_model=ProductoResponse,
    status_code=status.HTTP_200_OK,
    summary="Update product",
    dependencies=[Depends(require_role(_WRITE_ROLES))],
)
async def update_producto(
    producto_id: int,
    data: ProductoUpdate,
    session: AsyncSession = Depends(get_db),
) -> ProductoResponse:
    service = ProductoService(session)
    try:
        producto = await service.update(producto_id, data)
        await session.commit()
        return _to_response(producto)
    except ValueError as exc:
        await session.rollback()
        err = str(exc)
        http_status = (
            status.HTTP_404_NOT_FOUND if "not found" in err else status.HTTP_400_BAD_REQUEST
        )
        raise HTTPException(
            status_code=http_status,
            detail={"error": "validation_error", "message": err},
        )
    except Exception:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "server_error", "message": "Failed to update product"},
        )


@router.patch(
    "/{producto_id}/stock",
    response_model=ProductoResponse,
    status_code=status.HTTP_200_OK,
    summary="Adjust product stock",
    dependencies=[Depends(require_role(_WRITE_ROLES))],
)
async def update_stock(
    producto_id: int,
    data: ProductoStockUpdate,
    session: AsyncSession = Depends(get_db),
) -> ProductoResponse:
    service = ProductoService(session)
    try:
        producto = await service.update_stock(producto_id, data)
        await session.commit()
        return _to_response(producto)
    except ValueError as exc:
        await session.rollback()
        err = str(exc)
        http_status = (
            status.HTTP_404_NOT_FOUND if "not found" in err else status.HTTP_400_BAD_REQUEST
        )
        raise HTTPException(
            status_code=http_status,
            detail={"error": "validation_error", "message": err},
        )
    except Exception:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "server_error", "message": "Failed to update stock"},
        )


@router.delete(
    "/{producto_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Soft delete product",
    dependencies=[Depends(require_role(_WRITE_ROLES))],
)
async def delete_producto(
    producto_id: int,
    session: AsyncSession = Depends(get_db),
) -> None:
    service = ProductoService(session)
    try:
        await service.soft_delete(producto_id)
        await session.commit()
    except ValueError as exc:
        await session.rollback()
        err = str(exc)
        http_status = (
            status.HTTP_404_NOT_FOUND if "not found" in err else status.HTTP_400_BAD_REQUEST
        )
        raise HTTPException(
            status_code=http_status,
            detail={"error": "validation_error", "message": err},
        )
    except Exception:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "server_error", "message": "Failed to delete product"},
        )
