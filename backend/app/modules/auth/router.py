"""Authentication routes for registration, login, and token management."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.modules.auth.service import AuthService
from app.modules.auth.schemas import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
)

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
    responses={404: {"description": "Not found"}},
)


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="User registration",
    description="Register a new user with email and password",
)
async def register(
    request: RegisterRequest,
    session: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Register a new user.
    
    Creates a new user account with the CLIENT role and returns JWT tokens.
    
    Args:
        request: Registration request with user details
        session: Database session dependency
        
    Returns:
        TokenResponse with access token, refresh token, and user data
        
    Raises:
        HTTPException 409: Email already registered
        HTTPException 400: Invalid input data
        HTTPException 500: Server error
    """
    try:
        auth_service = AuthService(session)
        token_response = await auth_service.register(request)
        return token_response
    except ValueError as e:
        # Email already registered
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e),
        )
    except Exception as e:
        # Log error and return generic message
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating user account",
        )


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="User login",
    description="Login with email and password to get tokens",
)
async def login(
    request: LoginRequest,
    session: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Login user.
    
    Placeholder for US-002. Authenticates user and returns JWT tokens.
    
    Args:
        request: Login request with email and password
        session: Database session dependency
        
    Returns:
        TokenResponse with access token, refresh token, and user data
        
    Raises:
        HTTPException 401: Invalid credentials
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Login endpoint not yet implemented (US-002)",
    )


@router.post(
    "/refresh",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Refresh access token",
    description="Use refresh token to get new access token",
)
async def refresh_token(
    session: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Refresh access token.
    
    Placeholder for US-003. Uses refresh token to issue new access token.
    
    Args:
        session: Database session dependency
        
    Returns:
        TokenResponse with new access token and refresh token
        
    Raises:
        HTTPException 401: Invalid refresh token
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Refresh endpoint not yet implemented (US-003)",
    )
