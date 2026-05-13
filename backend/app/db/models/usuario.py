"""User, Role, and Authentication models"""

from datetime import datetime
from typing import Optional
from enum import Enum

from sqlmodel import Field, Relationship, Column, String, Integer, DateTime, Boolean
from sqlalchemy import Index

from app.db.base import BaseModel


class RolEnum(str, Enum):
    """User role enumeration (matches domain spec from CHANGES.md)."""

    ADMIN = "admin"
    STOCK = "stock"
    PEDIDOS = "pedidos"
    CLIENT = "client"


class Rol(BaseModel, table=True):
    """Role model for user authorization."""

    __tablename__ = "roles"

    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(
        sa_column=Column(String(50), unique=True, nullable=False),
        description="Role name",
    )
    descripcion: Optional[str] = Field(
        default=None,
        description="Role description",
    )

    # Relationships
    usuario_roles: list["UsuarioRol"] = Relationship(back_populates="rol")

    __table_args__ = (Index("idx_roles_nombre", "nombre"),)


class Usuario(BaseModel, table=True):
    """User model."""

    __tablename__ = "usuarios"

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(
        sa_column=Column(String(255), unique=True, nullable=False),
        description="User email address",
    )
    nombre: str = Field(
        sa_column=Column(String(100), nullable=False),
        description="User full name",
    )
    apellido: Optional[str] = Field(
        default=None,
        sa_column=Column(String(100), nullable=True),
        description="User last name",
    )
    hashed_password: str = Field(
        description="Hashed password",
    )
    numero_telefono: Optional[str] = Field(
        default=None,
        sa_column=Column(String(20)),
        description="User phone number",
    )
    activo: bool = Field(
        default=True,
        description="Whether user account is active",
    )
    verificado: bool = Field(
        default=False,
        description="Whether user email is verified",
    )

    # Relationships
    usuario_roles: list["UsuarioRol"] = Relationship(back_populates="usuario")
    refresh_tokens: list["RefreshToken"] = Relationship(back_populates="usuario")
    direcciones_entrega: list["DireccionEntrega"] = Relationship(back_populates="usuario")
    pedidos: list["Pedido"] = Relationship(back_populates="usuario")

    __table_args__ = (
        Index("idx_usuarios_email", "email"),
        Index("idx_usuarios_activo", "activo"),
    )


class UsuarioRol(BaseModel, table=True):
    """User-Role association model."""

    __tablename__ = "usuario_roles"

    id: Optional[int] = Field(default=None, primary_key=True)
    usuario_id: int = Field(
        foreign_key="usuarios.id",
        nullable=False,
        description="Usuario ID",
    )
    rol_id: int = Field(
        foreign_key="roles.id",
        nullable=False,
        description="Rol ID",
    )

    # Relationships
    usuario: Usuario = Relationship(back_populates="usuario_roles")
    rol: Rol = Relationship(back_populates="usuario_roles")

    __table_args__ = (
        Index("idx_usuario_roles_usuario_id_rol_id", "usuario_id", "rol_id"),
    )


class RefreshToken(BaseModel, table=True):
    """Refresh token model for JWT authentication."""

    __tablename__ = "refresh_tokens"

    id: Optional[int] = Field(default=None, primary_key=True)
    usuario_id: int = Field(
        foreign_key="usuarios.id",
        nullable=False,
        description="Usuario ID",
    )
    token_hash: str = Field(
        sa_column=Column(String(500), unique=True, nullable=False),
        description="Hashed refresh token (SHA-256)",
    )
    expires_at: datetime = Field(
        description="Token expiration timestamp",
    )
    revoked_at: Optional[datetime] = Field(
        default=None,
        description="Timestamp when token was revoked",
    )
    replaced_by_id: Optional[int] = Field(
        default=None,
        foreign_key="refresh_tokens.id",
        description="ID of the token that replaced this one (on rotation)",
    )
    family_id: str = Field(
        sa_column=Column(String(36), nullable=False),
        description="UUID v4 grouping tokens of the same login session",
    )
    last_used_at: Optional[datetime] = Field(
        default=None,
        description="Timestamp when token was last used",
    )

    # Relationships
    usuario: Usuario = Relationship(back_populates="refresh_tokens")
    # Self-referential relationship for replaced_by
    replaced_by: Optional["RefreshToken"] = Relationship(
        back_populates="replaced_token",
        sa_relationship_kwargs={"remote_side": "RefreshToken.id"},
    )
    replaced_token: list["RefreshToken"] = Relationship(back_populates="replaced_by")

    __table_args__ = (
        Index("idx_refresh_tokens_usuario_id", "usuario_id"),
        Index("idx_refresh_tokens_token_hash", "token_hash"),
        Index("idx_refresh_tokens_family_id", "family_id"),
    )


class DireccionEntrega(BaseModel, table=True):
    """Delivery address model."""

    __tablename__ = "direcciones_entrega"

    id: Optional[int] = Field(default=None, primary_key=True)
    usuario_id: int = Field(
        foreign_key="usuarios.id",
        nullable=False,
        description="Usuario ID",
    )
    calle: str = Field(
        sa_column=Column(String(255), nullable=False),
        description="Street address",
    )
    numero: str = Field(
        sa_column=Column(String(10), nullable=False),
        description="Street number",
    )
    departamento: Optional[str] = Field(
        default=None,
        sa_column=Column(String(20)),
        description="Apartment/unit number",
    )
    ciudad: str = Field(
        sa_column=Column(String(100), nullable=False),
        description="City",
    )
    provincia: str = Field(
        sa_column=Column(String(100), nullable=False),
        description="State/Province",
    )
    codigo_postal: str = Field(
        sa_column=Column(String(20), nullable=False),
        description="Postal code",
    )
    pais: str = Field(
        default="Argentina",
        sa_column=Column(String(100), nullable=False),
        description="Country",
    )
    es_predeterminada: bool = Field(
        default=False,
        description="Whether this is the default address",
    )

    # Relationships
    usuario: Usuario = Relationship(back_populates="direcciones_entrega")

    __table_args__ = (Index("idx_direcciones_entrega_usuario_id", "usuario_id"),)
