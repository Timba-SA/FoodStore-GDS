"""Router for the Ingredientes module.

Endpoints:
    GET    /api/v1/ingredientes          - List ingredients (with optional filters)
    GET    /api/v1/ingredientes/{id}     - Get single ingredient
    POST   /api/v1/ingredientes          - Create (ADMIN | STOCK)
    PUT    /api/v1/ingredientes/{id}     - Update (ADMIN | STOCK)
    DELETE /api/v1/ingredientes/{id}     - Soft delete (ADMIN | STOCK)
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.modules.auth.router import require_role
from app.modules.ingredientes.schemas import (
    IngredienteCreate,
    IngredienteResponse,
    IngredienteUpdate,
)
from app.modules.ingredientes.service import IngredienteService

router = APIRouter(prefix="/ingredientes", tags=["ingredientes"])

_WRITE_ROLES = ["admin", "stock"]


@router.get(
    "",
    response_model=list[IngredienteResponse],
    status_code=status.HTTP_200_OK,
    summary="List ingredients",
    description=(
        "Return ingredients. Optional filters: "
        "`include_inactive`, `solo_alergenos`, `search` (partial name match)."
    ),
)
async def list_ingredientes(
    include_inactive: bool = Query(default=False, description="Include soft-deleted records"),
    solo_alergenos: bool = Query(default=False, description="Return only allergens"),
    search: Optional[str] = Query(default=None, description="Search by name (partial match)"),
    session: AsyncSession = Depends(get_db),
) -> list[IngredienteResponse]:
    service = IngredienteService(session)
    ingredientes = await service.get_all(
        include_inactive=include_inactive,
        solo_alergenos=solo_alergenos,
        search=search,
    )
    return [IngredienteResponse.from_orm(i) for i in ingredientes]


@router.get(
    "/{ingrediente_id}",
    response_model=IngredienteResponse,
    status_code=status.HTTP_200_OK,
    summary="Get ingredient by ID",
)
async def get_ingrediente(
    ingrediente_id: int,
    session: AsyncSession = Depends(get_db),
) -> IngredienteResponse:
    service = IngredienteService(session)
    ingrediente = await service.get_by_id(ingrediente_id)
    if ingrediente is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "not_found", "message": f"Ingrediente {ingrediente_id} not found"},
        )
    return IngredienteResponse.from_orm(ingrediente)


@router.post(
    "",
    response_model=IngredienteResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create ingredient",
    dependencies=[Depends(require_role(_WRITE_ROLES))],
)
async def create_ingrediente(
    data: IngredienteCreate,
    session: AsyncSession = Depends(get_db),
) -> IngredienteResponse:
    service = IngredienteService(session)
    try:
        ingrediente = await service.create(data)
        await session.commit()
        return IngredienteResponse.from_orm(ingrediente)
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
            detail={"error": "server_error", "message": "Failed to create ingredient"},
        )


@router.put(
    "/{ingrediente_id}",
    response_model=IngredienteResponse,
    status_code=status.HTTP_200_OK,
    summary="Update ingredient",
    dependencies=[Depends(require_role(_WRITE_ROLES))],
)
async def update_ingrediente(
    ingrediente_id: int,
    data: IngredienteUpdate,
    session: AsyncSession = Depends(get_db),
) -> IngredienteResponse:
    service = IngredienteService(session)
    try:
        ingrediente = await service.update(ingrediente_id, data)
        await session.commit()
        return IngredienteResponse.from_orm(ingrediente)
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
            detail={"error": "server_error", "message": "Failed to update ingredient"},
        )


@router.delete(
    "/{ingrediente_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Soft delete ingredient",
    dependencies=[Depends(require_role(_WRITE_ROLES))],
)
async def delete_ingrediente(
    ingrediente_id: int,
    session: AsyncSession = Depends(get_db),
) -> None:
    service = IngredienteService(session)
    try:
        await service.soft_delete(ingrediente_id)
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
            detail={"error": "server_error", "message": "Failed to delete ingredient"},
        )
