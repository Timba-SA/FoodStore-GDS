"""
Admin router — user management, metrics, and deleted records.
All routes require the 'admin' role.
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.dependencies import get_db
from app.modules.auth.router import get_current_user, require_role
from app.modules.auth.schemas import UserResponse
from app.modules.auth.service import AuthService
from app.modules.admin.schemas import (
    UpdateRolesRequest,
    UsuarioCreate,
    UsuarioUpdate,
    UsuarioListResponse,
    DashboardMetrics,
    VentaDelDia,
    TopProducto,
    EstadoPedidoCount,
)
from app.modules.admin.service import AdminService
from app.modules.admin.service_metricas import MetricsService
from app.db.models.pedido import Pedido, EstadoPedido

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(require_role(["admin"]))],
)


# ─── Helpers ───────────────────────────────────────────────────────────────────

async def _build_user_list_response(user, session: AsyncSession) -> UsuarioListResponse:
    auth = AuthService(session)
    roles = await auth.get_user_roles(user.id)
    return UsuarioListResponse(
        id=user.id,
        nombre=user.nombre,
        email=user.email,
        numero_telefono=user.numero_telefono,
        activo=user.activo,
        roles=roles,
        created_at=user.created_at,
        deleted_at=user.deleted_at,
    )


async def _build_user_response(user, session: AsyncSession) -> UserResponse:
    auth = AuthService(session)
    roles = await auth.get_user_roles(user.id)
    return UserResponse(
        id=user.id,
        nombre=user.nombre,
        email=user.email,
        numero_telefono=user.numero_telefono,
        roles=roles,
        creado_en=user.created_at,
        actualizado_en=user.updated_at,
    )


# ─── User Management ───────────────────────────────────────────────────────────

@router.get(
    "/usuarios",
    response_model=list[UsuarioListResponse],
    summary="List all users (paginated)",
)
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    include_deleted: bool = Query(False),
    session: AsyncSession = Depends(get_db),
):
    svc = AdminService(session)
    users = await svc.list_users(skip=skip, limit=limit, include_deleted=include_deleted)
    return [await _build_user_list_response(u, session) for u in users]


@router.get(
    "/usuarios/{user_id}",
    response_model=UsuarioListResponse,
    summary="Get user by ID",
)
async def get_user(
    user_id: int,
    session: AsyncSession = Depends(get_db),
):
    svc = AdminService(session)
    user = await svc.get_user(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado.")
    return await _build_user_list_response(user, session)


@router.post(
    "/usuarios",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create user manually",
)
async def create_user(
    data: UsuarioCreate,
    session: AsyncSession = Depends(get_db),
):
    svc = AdminService(session)
    try:
        user = await svc.create_user(data)
        await session.commit()
        return await _build_user_response(user, session)
    except ValueError as exc:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.put(
    "/usuarios/{user_id}",
    response_model=UserResponse,
    summary="Update user details",
)
async def update_user(
    user_id: int,
    data: UsuarioUpdate,
    session: AsyncSession = Depends(get_db),
):
    svc = AdminService(session)
    try:
        user = await svc.update_user(user_id, data)
        await session.commit()
        return await _build_user_response(user, session)
    except ValueError as exc:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.put(
    "/usuarios/{user_id}/roles",
    response_model=UserResponse,
    summary="Update user roles",
)
async def update_user_roles(
    user_id: int,
    request: UpdateRolesRequest,
    session: AsyncSession = Depends(get_db),
    current_admin: UserResponse = Depends(get_current_user),
):
    try:
        svc = AdminService(session)
        user = await svc.update_user_roles(
            user_id=user_id,
            roles_ids=request.roles_ids,
            current_admin_id=current_admin.id,
        )
        await session.commit()
        return await _build_user_response(user, session)
    except ValueError as exc:
        await session.rollback()
        error_msg = str(exc)
        if "last admin" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": "last_admin", "message": error_msg},
            )
        elif "not found" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"error": "not_found", "message": error_msg},
            )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)
    except Exception:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update roles",
        )


@router.delete(
    "/usuarios/{user_id}",
    status_code=status.HTTP_200_OK,
    summary="Soft-delete user",
)
async def delete_user(
    user_id: int,
    session: AsyncSession = Depends(get_db),
    current_admin: UserResponse = Depends(get_current_user),
):
    svc = AdminService(session)
    try:
        await svc.soft_delete_user(user_id, current_admin_id=current_admin.id)
        await session.commit()
        return {"message": "Usuario eliminado correctamente."}
    except ValueError as exc:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


# ─── Metrics ───────────────────────────────────────────────────────────────────

@router.get(
    "/metricas/dashboard",
    response_model=DashboardMetrics,
    summary="Dashboard KPIs",
)
async def dashboard_metrics(session: AsyncSession = Depends(get_db)):
    svc = MetricsService(session)
    return await svc.get_dashboard()


@router.get(
    "/metricas/ventas",
    response_model=list[VentaDelDia],
    summary="Daily sales for last N days",
)
async def ventas_metrics(
    dias: int = Query(7, ge=1, le=90),
    session: AsyncSession = Depends(get_db),
):
    svc = MetricsService(session)
    return await svc.get_ventas(dias=dias)


@router.get(
    "/metricas/productos-top",
    response_model=list[TopProducto],
    summary="Top N products by units sold",
)
async def productos_top(
    limit: int = Query(5, ge=1, le=20),
    session: AsyncSession = Depends(get_db),
):
    svc = MetricsService(session)
    return await svc.get_productos_top(limit=limit)


@router.get(
    "/metricas/estados-pedidos",
    response_model=list[EstadoPedidoCount],
    summary="Order count per status",
)
async def estados_pedidos(session: AsyncSession = Depends(get_db)):
    svc = MetricsService(session)
    return await svc.get_estados_pedidos()


# ─── Deleted records ───────────────────────────────────────────────────────────

@router.get(
    "/registros-eliminados",
    summary="List soft-deleted records",
)
async def registros_eliminados(session: AsyncSession = Depends(get_db)):
    svc = AdminService(session)
    return await svc.get_deleted_records()


# ─── Admin Pedidos ─────────────────────────────────────────────────────────────

@router.get(
    "/pedidos",
    summary="List all orders (admin view, filterable by estado)",
)
async def admin_list_pedidos(
    estado: Optional[str] = Query(default=None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    session: AsyncSession = Depends(get_db),
):
    """Returns all pedidos system-wide. Optionally filter by estado nombre."""
    # Join EstadoPedido to get the nombre
    q = (
        select(Pedido, EstadoPedido.nombre.label("estado_nombre"))
        .join(EstadoPedido, EstadoPedido.id == Pedido.estado_id)
        .where(Pedido.deleted_at.is_(None))
    )
    if estado:
        q = q.where(EstadoPedido.nombre == estado)
    q = q.order_by(Pedido.created_at.desc()).offset(skip).limit(limit)
    result = await session.execute(q)
    rows = result.all()
    return [
        {
            "id": pedido.id,
            "numero_pedido": pedido.numero_pedido,
            "estado_nombre": nombre,
            "total": str(pedido.total),
            "created_at": pedido.created_at.isoformat() if pedido.created_at else None,
        }
        for pedido, nombre in rows
    ]

