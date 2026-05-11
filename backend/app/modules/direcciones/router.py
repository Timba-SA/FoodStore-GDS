"""Router for the Direcciones module.

All endpoints require an authenticated user (get_current_user).
Ownership is validated in the service layer.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.modules.auth.router import get_current_user
from app.modules.direcciones.schemas import (
    DireccionCreate,
    DireccionResponse,
    DireccionUpdate,
)
from app.modules.direcciones.service import DireccionService

router = APIRouter(prefix="/direcciones", tags=["direcciones"])


def _to_response(d) -> DireccionResponse:
    return DireccionResponse(
        id=d.id,
        usuario_id=d.usuario_id,
        calle=d.calle,
        numero=d.numero,
        departamento=d.departamento,
        ciudad=d.ciudad,
        provincia=d.provincia,
        codigo_postal=d.codigo_postal,
        pais=d.pais,
        es_predeterminada=d.es_predeterminada,
    )


@router.get(
    "",
    response_model=list[DireccionResponse],
    status_code=status.HTTP_200_OK,
    summary="List own addresses",
)
async def list_direcciones(
    session: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
) -> list[DireccionResponse]:
    service = DireccionService(session)
    direcciones = await service.get_by_usuario(current_user.id)
    return [_to_response(d) for d in direcciones]


@router.post(
    "",
    response_model=DireccionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create address",
)
async def create_direccion(
    data: DireccionCreate,
    session: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
) -> DireccionResponse:
    service = DireccionService(session)
    try:
        direccion = await service.create(current_user.id, data)
        await session.commit()
        return _to_response(direccion)
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
            detail={"error": "server_error", "message": "Failed to create address"},
        )


@router.put(
    "/{direccion_id}",
    response_model=DireccionResponse,
    status_code=status.HTTP_200_OK,
    summary="Update address",
)
async def update_direccion(
    direccion_id: int,
    data: DireccionUpdate,
    session: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
) -> DireccionResponse:
    service = DireccionService(session)
    try:
        direccion = await service.update(direccion_id, current_user.id, data)
        await session.commit()
        return _to_response(direccion)
    except ValueError as exc:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "not_found", "message": str(exc)},
        )
    except Exception:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "server_error", "message": "Failed to update address"},
        )


@router.patch(
    "/{direccion_id}/principal",
    response_model=DireccionResponse,
    status_code=status.HTTP_200_OK,
    summary="Set address as default",
)
async def set_default(
    direccion_id: int,
    session: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
) -> DireccionResponse:
    service = DireccionService(session)
    try:
        direccion = await service.set_default(direccion_id, current_user.id)
        await session.commit()
        return _to_response(direccion)
    except ValueError as exc:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "not_found", "message": str(exc)},
        )
    except Exception:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "server_error", "message": "Failed to set default address"},
        )


@router.delete(
    "/{direccion_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete address (hard delete)",
)
async def delete_direccion(
    direccion_id: int,
    session: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
) -> None:
    service = DireccionService(session)
    try:
        await service.delete(direccion_id, current_user.id)
        await session.commit()
    except ValueError as exc:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "not_found", "message": str(exc)},
        )
    except Exception:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "server_error", "message": "Failed to delete address"},
        )
