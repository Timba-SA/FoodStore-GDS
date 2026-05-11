"""Authentication routes for registration, login, refresh, logout, and /me."""

from fastapi import APIRouter, Depends, HTTPException, Request, status, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.core.rate_limit import limiter
from app.core.config import get_settings
from app.modules.auth.service import AuthService
from app.modules.auth.schemas import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    RefreshTokenRequest,
    UserResponse,
)

_settings = get_settings()

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
    responses={404: {"description": "Not found"}},
)

bearer_scheme = HTTPBearer(auto_error=False)


# ------------------------------------------------------------------ #
# Dependency: resolve current user from Bearer token                  #
# ------------------------------------------------------------------ #


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(bearer_scheme),
    session: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Dependency that validates the access token and returns the current user.

    Raises:
        HTTPException 401: Missing or invalid token
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": "missing_token",
                "message": "Authorization header is required",
            },
            headers={"WWW-Authenticate": "Bearer"},
        )

    auth_service = AuthService(session)
    try:
        user = await auth_service.get_current_user(credentials.credentials)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": "invalid_token",
                "message": str(exc),
            },
            headers={"WWW-Authenticate": "Bearer"},
        )

    roles = await auth_service.get_user_roles(user.id)
    return UserResponse(
        id=user.id,
        nombre=user.nombre,
        email=user.email,
        numero_telefono=user.numero_telefono,
        roles=roles,
        creado_en=user.created_at,
        actualizado_en=user.updated_at,
    )


# ------------------------------------------------------------------ #
# Endpoints                                                            #
# ------------------------------------------------------------------ #


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="User registration",
    description="Register a new user with email and password",
)
@limiter.limit(_settings.RATE_LIMIT_REGISTER)
async def register(
    request: Request,
    body: RegisterRequest,
    session: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Register a new user.

    Creates a new user account with the CUSTOMER role and returns JWT tokens.

    Raises:
        HTTPException 409: Email already registered
        HTTPException 500: Server error
    """
    try:
        auth_service = AuthService(session)
        return await auth_service.register(body)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "error": "email_conflict",
                "message": str(exc),
            },
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "server_error", "message": "Error creating user account"},
        )


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="User login",
    description="Login with email and password to get tokens",
)
@limiter.limit(_settings.RATE_LIMIT_LOGIN)
async def login(
    request: Request,
    body: LoginRequest,
    session: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Login user.

    Authenticates user and returns JWT tokens.

    Raises:
        HTTPException 401: Invalid credentials
    """
    try:
        auth_service = AuthService(session)
        return await auth_service.login(
            email=body.email,
            password=body.password,
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": "invalid_credentials",
                "message": "Email o contraseña incorrectos",
            },
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "server_error", "message": "Error during login"},
        )


@router.post(
    "/refresh",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Refresh access token",
    description="Use a valid refresh token to obtain a new token pair",
)
@limiter.limit(_settings.RATE_LIMIT_REFRESH)
async def refresh_token(
    request: Request,
    body: RefreshTokenRequest,
    session: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Rotate refresh token and issue new access + refresh tokens.

    Implements rotation with replay detection:
    - Valid token → revoke old, issue new in same family
    - Already-revoked token → revoke entire family and return 401

    Raises:
        HTTPException 401: Invalid, expired, or replayed refresh token
    """
    try:
        auth_service = AuthService(session)
        return await auth_service.refresh(body.refresh_token)
    except ValueError as exc:
        error_msg = str(exc)
        error_code = "invalid_refresh_token"

        if "reuse detected" in error_msg or "replay" in error_msg.lower():
            error_code = "token_replay_detected"
        elif "expired" in error_msg.lower():
            error_code = "token_expired"

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": error_code, "message": error_msg},
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "server_error", "message": "Error refreshing token"},
        )


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="Logout",
    description="Revoke the current refresh token",
)
async def logout(
    request: RefreshTokenRequest,
    session: AsyncSession = Depends(get_db),
) -> dict:
    """Revoke refresh token on logout.

    Idempotent: returns 200 even if token is already revoked or not found.
    The client MUST discard both tokens after calling this endpoint.
    """
    auth_service = AuthService(session)
    await auth_service.logout(request.refresh_token)
    return {"message": "Logged out successfully"}


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current user",
    description="Return the authenticated user's profile using the access token",
)
async def get_me(
    current_user: UserResponse = Depends(get_current_user),
) -> UserResponse:
    """Return current authenticated user's profile.

    Requires a valid Bearer access token in the Authorization header.

    Raises:
        HTTPException 401: Missing or invalid access token
    """
    return current_user
