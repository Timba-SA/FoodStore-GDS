from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.modules.auth.router import get_current_user, require_role
from app.modules.auth.schemas import UserResponse
from app.modules.admin.schemas import UpdateRolesRequest
from app.modules.admin.service import AdminService
from app.modules.auth.service import AuthService

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(require_role(["admin"]))]
)

@router.put(
    "/usuarios/{user_id}/roles",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Update user roles",
    description="Assign or revoke roles from a user. Only admins can perform this action."
)
async def update_user_roles(
    user_id: int,
    request: UpdateRolesRequest,
    session: AsyncSession = Depends(get_db),
    current_admin: UserResponse = Depends(get_current_user),
) -> UserResponse:
    try:
        admin_service = AdminService(session)
        user = await admin_service.update_user_roles(
            user_id=user_id,
            roles_ids=request.roles_ids,
            current_admin_id=current_admin.id
        )
        
        # Build response using auth service
        auth_service = AuthService(session)
        roles = await auth_service.get_user_roles(user.id)
        
        # Commit manually since we're not using UnitOfWork here yet
        await session.commit()
        
        return UserResponse(
            id=user.id,
            nombre=user.nombre,
            email=user.email,
            numero_telefono=user.numero_telefono,
            roles=roles,
            creado_en=user.created_at,
            actualizado_en=user.updated_at,
        )
    except ValueError as exc:
        await session.rollback()
        error_msg = str(exc)
        if "last admin" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": "last_admin", "message": error_msg}
            )
        elif "not found" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"error": "not_found", "message": error_msg}
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": "bad_request", "message": error_msg}
            )
    except Exception as exc:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "server_error", "message": "Failed to update roles"}
        )
