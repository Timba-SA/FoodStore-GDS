from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel

from app.core.dependencies import get_db
from app.modules.auth.router import require_role
from app.modules.auth.service import AuthService
from app.db.models.pedido import Pedido, EstadoPedido, HistorialEstadoPedido
from app.db.models.producto import Producto
from app.modules.cocina.service import cocina_ws_manager

router = APIRouter(prefix="/cocina", tags=["cocina"])

# --- Schemas ---

class CocinaDetallePedidoResponse(BaseModel):
    id: int
    producto_id: int
    nombre_snapshot: Optional[str]
    cantidad: int
    personalizacion: Optional[List[int]]

    model_config = {"from_attributes": True}

class CocinaPedidoResponse(BaseModel):
    id: int
    numero_pedido: str
    estado_nombre: str
    notas: Optional[str]
    created_at: datetime
    detalles: List[CocinaDetallePedidoResponse]

    model_config = {"from_attributes": True}

class DisponibilidadUpdate(BaseModel):
    disponible: bool

class ProductoResponse(BaseModel):
    id: int
    nombre: str
    disponible: bool

    model_config = {"from_attributes": True}

# --- Helpers ---

async def _get_estado_nombre(pedido, session) -> str:
    """Resolve current state name from historical states."""
    if pedido.historial_estados:
        # Sort in memory
        sorted_h = sorted(pedido.historial_estados, key=lambda x: x.fecha_cambio, reverse=True)
        if sorted_h and sorted_h[0].estado:
            return sorted_h[0].estado.nombre
    
    # Fallback to direct state_id lookup
    result = await session.execute(
        select(EstadoPedido).where(EstadoPedido.id == pedido.estado_id)
    )
    estado = result.scalars().first()
    return estado.nombre if estado else "desconocido"

# --- Endpoints ---

@router.get(
    "/pedidos",
    response_model=List[CocinaPedidoResponse],
    status_code=status.HTTP_200_OK,
    summary="Get active kitchen orders (confirmado, en_preparacion) sorted by oldest first (FIFO)"
)
async def get_active_orders(
    session: AsyncSession = Depends(get_db),
    current_user = Depends(require_role(["cocina", "pedidos", "admin"]))
):
    stmt = (
        select(Pedido)
        .join(EstadoPedido)
        .options(
            selectinload(Pedido.detalles_pedido),
            selectinload(Pedido.historial_estados).selectinload(HistorialEstadoPedido.estado),
        )
        .where(EstadoPedido.nombre.in_(["confirmado", "en_preparacion"]))
        .order_by(Pedido.created_at.asc())
    )
    result = await session.execute(stmt)
    pedidos = result.scalars().all()
    
    # Map to schemas and resolve state names
    response = []
    for pedido in pedidos:
        estado_nombre = await _get_estado_nombre(pedido, session)
        
        detalles_response = [
            CocinaDetallePedidoResponse(
                id=d.id,
                producto_id=d.producto_id,
                nombre_snapshot=d.nombre_snapshot,
                cantidad=d.cantidad,
                personalizacion=d.personalizacion,
            )
            for d in (pedido.detalles_pedido or [])
        ]
        
        response.append(
            CocinaPedidoResponse(
                id=pedido.id,
                numero_pedido=pedido.numero_pedido,
                estado_nombre=estado_nombre,
                notas=pedido.notas,
                created_at=pedido.created_at,
                detalles=detalles_response,
            )
        )
    return response


@router.patch(
    "/productos/{producto_id}/disponibilidad",
    response_model=ProductoResponse,
    status_code=status.HTTP_200_OK,
    summary="Update product temporary availability"
)
async def update_disponibilidad(
    producto_id: int,
    data: DisponibilidadUpdate,
    session: AsyncSession = Depends(get_db),
    current_user = Depends(require_role(["cocina", "pedidos", "admin"]))
):
    result = await session.execute(
        select(Producto).where(Producto.id == producto_id)
    )
    producto = result.scalars().first()
    if not producto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producto #{producto_id} no encontrado."
        )
    
    producto.disponible = data.disponible
    await session.commit()
    await session.refresh(producto)
    return producto


@router.websocket("/ws")
async def cocina_ws(
    websocket: WebSocket,
    token: str = Query(...),
    session: AsyncSession = Depends(get_db)
):
    # Decode and verify JWT
    auth_service = AuthService(session)
    try:
        payload = auth_service.decode_access_token(token)
        if not payload:
            await websocket.close(code=1008)
            return
        
        user = await auth_service.get_user_by_id(payload.user_id)
        if not user or not user.activo:
            await websocket.close(code=1008)
            return
            
        roles = await auth_service.get_user_roles(user.id)
        if not any(role in roles for role in ["cocina", "pedidos", "admin"]):
            await websocket.close(code=1008)
            return
            
    except Exception:
        await websocket.close(code=1008)
        return

    # WebSocket connection accepted and verified
    await cocina_ws_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        await cocina_ws_manager.disconnect(websocket)
    except Exception:
        await cocina_ws_manager.disconnect(websocket)
