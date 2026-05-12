"""
Perfil router — authenticated user's own profile management.

Routes:
  GET  /perfil                      → view own profile
  PUT  /perfil                      → update name / phone
  POST /perfil/cambiar-contrasena   → change password (verify old first)
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.modules.auth.router import get_current_user
from app.modules.auth.schemas import UserResponse
from app.modules.auth.service import AuthService
from app.modules.admin.schemas import PerfilUpdate, CambiarContrasenaRequest

router = APIRouter(prefix="/perfil", tags=["perfil"])


@router.get("", response_model=UserResponse, summary="View own profile")
async def get_perfil(
    session: AsyncSession = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user),
):
    return current_user


@router.put("", response_model=UserResponse, summary="Update own profile")
async def update_perfil(
    data: PerfilUpdate,
    session: AsyncSession = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user),
):
    auth = AuthService(session)
    user = await auth.get_user_by_id(current_user.id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado.")

    if data.nombre is not None:
        user.nombre = data.nombre
    if data.numero_telefono is not None:
        user.numero_telefono = data.numero_telefono
    user.updated_at = datetime.now(timezone.utc)

    await session.commit()

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


@router.post(
    "/cambiar-contrasena",
    status_code=status.HTTP_200_OK,
    summary="Change own password",
)
async def cambiar_contrasena(
    data: CambiarContrasenaRequest,
    session: AsyncSession = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user),
):
    auth = AuthService(session)
    user = await auth.get_user_by_id(current_user.id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado.")

    if not AuthService.verify_password(data.password_actual, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña actual no es correcta.",
        )

    user.hashed_password = AuthService.hash_password(data.password_nueva)
    user.updated_at = datetime.now(timezone.utc)
    await session.commit()

    return {"message": "Contraseña actualizada correctamente."}
