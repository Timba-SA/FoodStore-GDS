"""Authentication schemas for registration, login, and token responses."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field


class UserResponse(BaseModel):
    """User data response schema (no password)."""

    id: int
    nombre: str
    email: str
    numero_telefono: Optional[str] = None
    roles: List[str] = []
    creado_en: datetime
    actualizado_en: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Response schema for login and register endpoints."""

    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    user: UserResponse


class RegisterRequest(BaseModel):
    """Request schema for user registration."""

    nombre: str = Field(..., min_length=2, max_length=100, description="User full name")
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=8, description="User password (min 8 characters)")
    numero_telefono: Optional[str] = Field(
        None, max_length=20, description="User phone number (optional)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "nombre": "Juan Pérez",
                "email": "juan@example.com",
                "password": "SecurePassword123",
                "numero_telefono": "+541234567890",
            }
        }


class LoginRequest(BaseModel):
    """Request schema for user login."""

    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=1, description="User password")

    class Config:
        json_schema_extra = {
            "example": {
                "email": "juan@example.com",
                "password": "SecurePassword123",
            }
        }


class RefreshTokenRequest(BaseModel):
    """Request schema for token refresh."""

    refresh_token: str = Field(..., description="Refresh token")


class TokenPayload(BaseModel):
    """JWT token payload schema."""

    user_id: int
    email: str
    roles: List[str] = []
    exp: Optional[float] = None
