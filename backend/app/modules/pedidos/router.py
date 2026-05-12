"""
Pedidos router.

Endpoints:
  POST   /pedidos             — Create order from cart
  GET    /pedidos             — List orders (CLIENT: own, ADMIN: all)
  GET    /pedidos/{id}        — Order detail
  PATCH  /pedidos/{id}/estado — Advance FSM state
  DELETE /pedidos/{id}        — Cancel order
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.core.dependencies import get_db
from app.modules.auth.router import get_current_user
from app.modules.pedidos.schemas import (
    PedidoCreate,
    PedidoResponse,
    PedidoListResponse,
    DetallePedidoResponse,
    HistorialEstadoResponse,
    EstadoUpdate,
)
from app.modules.pedidos.service import PedidoService

router = APIRouter(prefix="/pedidos", tags=["pedidos"])


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _is_admin(user) -> bool:
    return hasattr(user, "rol") and user.rol and user.rol.nombre in ("ADMIN", "PEDIDOS")


def _pedido_to_response(pedido, estado_nombre: str) -> PedidoResponse:
    detalles = [
        DetallePedidoResponse(
            id=d.id,
            producto_id=d.producto_id,
            nombre_snapshot=d.nombre_snapshot,
            cantidad=d.cantidad,
            precio_unitario=d.precio_unitario,
            subtotal=d.subtotal,
            personalizacion=d.personalizacion,
        )
        for d in (pedido.detalles_pedido or [])
    ]
    historial = [
        HistorialEstadoResponse(
            id=h.id,
            estado_nombre=h.estado.nombre if h.estado else "?",
            fecha_cambio=h.fecha_cambio,
            usuario_id=h.usuario_id,
            nota=h.nota,
        )
        for h in sorted(pedido.historial_estados or [], key=lambda x: x.fecha_cambio)
    ]
    return PedidoResponse(
        id=pedido.id,
        usuario_id=pedido.usuario_id,
        numero_pedido=pedido.numero_pedido,
        estado_nombre=estado_nombre,
        subtotal=pedido.subtotal,
        impuestos=pedido.impuestos,
        costo_envio=pedido.costo_envio,
        total=pedido.total,
        direccion_entrega_id=pedido.direccion_entrega_id,
        direccion_snapshot=pedido.direccion_snapshot,
        notas=pedido.notas,
        created_at=pedido.created_at,
        detalles=detalles,
        historial=historial,
    )


async def _get_estado_nombre(pedido, session) -> str:
    """Resolve current state name from historial or fallback."""
    if pedido.historial_estados:
        sorted_h = sorted(pedido.historial_estados, key=lambda x: x.fecha_cambio, reverse=True)
        last = sorted_h[0]
        if last.estado:
            return last.estado.nombre
    return "desconocido"


# ─── Endpoints ───────────────────────────────────────────────────────────────

@router.post(
    "",
    response_model=PedidoResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create order from cart",
)
async def create_pedido(
    data: PedidoCreate,
    session: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = PedidoService(session)
    try:
        pedido = await service.create(current_user.id, data)
        await session.commit()
        # Reload with relationships
        pedido = await service.get_by_id(pedido.id, current_user.id, is_admin=True)
        estado_nombre = await _get_estado_nombre(pedido, session)
        return _pedido_to_response(pedido, estado_nombre)
    except ValueError as exc:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception as exc:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear pedido: {exc}",
        )


@router.get(
    "",
    response_model=list[PedidoListResponse],
    status_code=status.HTTP_200_OK,
    summary="List orders",
)
async def list_pedidos(
    estado: Optional[str] = Query(default=None),
    session: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = PedidoService(session)
    is_admin = _is_admin(current_user)
    pedidos = await service.get_pedidos(current_user.id, is_admin=is_admin, estado=estado)
    result = []
    for pedido in pedidos:
        nombre = await _get_estado_nombre(pedido, session)
        result.append(
            PedidoListResponse(
                id=pedido.id,
                numero_pedido=pedido.numero_pedido,
                estado_nombre=nombre,
                total=pedido.total,
                created_at=pedido.created_at,
            )
        )
    return result


@router.get(
    "/{pedido_id}",
    response_model=PedidoResponse,
    status_code=status.HTTP_200_OK,
    summary="Order detail",
)
async def get_pedido(
    pedido_id: int,
    session: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = PedidoService(session)
    try:
        is_admin = _is_admin(current_user)
        pedido = await service.get_by_id(pedido_id, current_user.id, is_admin=is_admin)
        estado_nombre = await _get_estado_nombre(pedido, session)
        return _pedido_to_response(pedido, estado_nombre)
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.patch(
    "/{pedido_id}/estado",
    response_model=PedidoResponse,
    status_code=status.HTTP_200_OK,
    summary="Advance order state (FSM)",
)
async def avanzar_estado(
    pedido_id: int,
    data: EstadoUpdate,
    session: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = PedidoService(session)
    try:
        pedido = await service.avanzar_estado(
            pedido_id=pedido_id,
            nuevo_estado_nombre=data.nuevo_estado,
            usuario_id=current_user.id,
            nota=data.nota,
        )
        await session.commit()
        pedido = await service.get_by_id(pedido_id, current_user.id, is_admin=True)
        estado_nombre = await _get_estado_nombre(pedido, session)
        return _pedido_to_response(pedido, estado_nombre)
    except ValueError as exc:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception as exc:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al avanzar estado: {exc}",
        )


@router.delete(
    "/{pedido_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Cancel order",
)
async def cancelar_pedido(
    pedido_id: int,
    session: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = PedidoService(session)
    try:
        is_admin = _is_admin(current_user)
        await service.cancelar(
            pedido_id=pedido_id,
            usuario_id=current_user.id,
            is_admin=is_admin,
        )
        await session.commit()
    except PermissionError as exc:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except ValueError as exc:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception as exc:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al cancelar pedido: {exc}",
        )
