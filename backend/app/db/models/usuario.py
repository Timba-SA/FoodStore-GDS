"""User, Role, and Authentication models."""

from datetime import datetime
from typing import Optional, List
from enum import Enum

from sqlmodel import Field, Relationship, Column, String, SQLModel
from sqlalchemy import Index, ForeignKey
from sqlalchemy.orm import relationship

from app.db.base import BaseModel


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------


class RolEnum(str, Enum):
    """Domain role names — used when creating roles programmatically.

    These values match exactly what is stored in the `roles.nombre` column
    and what the seed script inserts.  Use this enum instead of bare strings
    to avoid typos across the codebase.
    """

    ADMIN = "admin"
    STOCK = "stock"
    PEDIDOS = "pedidos"
    CLIENT = "client"


# ---------------------------------------------------------------------------
# Rol
# ---------------------------------------------------------------------------


class Rol(BaseModel, table=True):
    """Role model for user authorization."""

    __tablename__ = "roles"

    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(sa_column=Column(String(50), unique=True, nullable=False))
    descripcion: Optional[str] = Field(default=None)

    # Relationships
    usuario_roles: List["UsuarioRol"] = Relationship(back_populates="rol")

    __table_args__ = (Index("idx_roles_nombre", "nombre"),)


# ---------------------------------------------------------------------------
# Usuario
# ---------------------------------------------------------------------------


class Usuario(BaseModel, table=True):
    """User model."""

    __tablename__ = "usuarios"

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(sa_column=Column(String(255), unique=True, nullable=False))
    nombre: str = Field(sa_column=Column(String(100), nullable=False))
    apellido: Optional[str] = Field(
        default=None,
        sa_column=Column(String(100), nullable=True),
    )
    hashed_password: str = Field()
    numero_telefono: Optional[str] = Field(
        default=None,
        sa_column=Column(String(20), nullable=True),
    )
    activo: bool = Field(default=True)
    verificado: bool = Field(default=False)

    # Relationships
    usuario_roles: List["UsuarioRol"] = Relationship(back_populates="usuario")
    refresh_tokens: List["RefreshToken"] = Relationship(back_populates="usuario")
    direcciones_entrega: List["DireccionEntrega"] = Relationship(
        back_populates="usuario"
    )
    pedidos: List["Pedido"] = Relationship(back_populates="usuario")

    __table_args__ = (
        Index("idx_usuarios_email", "email"),
        Index("idx_usuarios_activo", "activo"),
    )


# ---------------------------------------------------------------------------
# UsuarioRol  (join table)
# ---------------------------------------------------------------------------


class UsuarioRol(BaseModel, table=True):
    """User-Role many-to-many association."""

    __tablename__ = "usuario_roles"

    id: Optional[int] = Field(default=None, primary_key=True)
    usuario_id: int = Field(foreign_key="usuarios.id", nullable=False)
    rol_id: int = Field(foreign_key="roles.id", nullable=False)

    # Relationships
    usuario: Usuario = Relationship(back_populates="usuario_roles")
    rol: Rol = Relationship(back_populates="usuario_roles")

    __table_args__ = (
        Index("idx_usuario_roles_usuario_id_rol_id", "usuario_id", "rol_id"),
    )


# ---------------------------------------------------------------------------
# RefreshToken
# ---------------------------------------------------------------------------


class RefreshToken(BaseModel, table=True):
    """Refresh token model — supports rotation and replay detection."""

    __tablename__ = "refresh_tokens"

    id: Optional[int] = Field(default=None, primary_key=True)
    usuario_id: int = Field(foreign_key="usuarios.id", nullable=False)
    token_hash: str = Field(
        sa_column=Column(String(500), unique=True, nullable=False)
    )
    expires_at: datetime = Field()
    revoked_at: Optional[datetime] = Field(default=None)
    replaced_by_id: Optional[int] = Field(
        default=None,
        sa_column=Column(
            "replaced_by_id",
            # Cannot use Field(foreign_key=...) for self-referential +
            # sa_column together; use raw Column with ForeignKey instead.
            ForeignKey("refresh_tokens.id"),
            nullable=True,
        ),
    )
    family_id: str = Field(sa_column=Column(String(36), nullable=False))
    last_used_at: Optional[datetime] = Field(default=None)

    # --------------------------------------------------------------------- #
    # Relationships                                                           #
    # --------------------------------------------------------------------- #

    usuario: Usuario = Relationship(back_populates="refresh_tokens")

    # Self-referential: which token replaced this one (audit trail).
    # SQLModel's Relationship() cannot handle remote_side on self-referential
    # FKs — use raw SQLAlchemy relationship() with explicit column references.
    replaced_by: Optional["RefreshToken"] = Relationship(
        sa_relationship=relationship(
            "RefreshToken",
            foreign_keys="[RefreshToken.replaced_by_id]",
            primaryjoin="RefreshToken.replaced_by_id == RefreshToken.id",
            remote_side="RefreshToken.id",
            uselist=False,
            overlaps="replaced_token",
        )
    )
    replaced_token: List["RefreshToken"] = Relationship(
        sa_relationship=relationship(
            "RefreshToken",
            foreign_keys="[RefreshToken.replaced_by_id]",
            primaryjoin="RefreshToken.id == RefreshToken.replaced_by_id",
            uselist=True,
            overlaps="replaced_by",
        )
    )

    __table_args__ = (
        Index("idx_refresh_tokens_usuario_id", "usuario_id"),
        Index("idx_refresh_tokens_token_hash", "token_hash"),
        Index("idx_refresh_tokens_family_id", "family_id"),
    )


# ---------------------------------------------------------------------------
# DireccionEntrega
# ---------------------------------------------------------------------------


class DireccionEntrega(BaseModel, table=True):
    """Delivery address model."""

    __tablename__ = "direcciones_entrega"

    id: Optional[int] = Field(default=None, primary_key=True)
    usuario_id: int = Field(foreign_key="usuarios.id", nullable=False)
    calle: str = Field(sa_column=Column(String(255), nullable=False))
    numero: str = Field(sa_column=Column(String(10), nullable=False))
    departamento: Optional[str] = Field(
        default=None,
        sa_column=Column(String(20), nullable=True),
    )
    ciudad: str = Field(sa_column=Column(String(100), nullable=False))
    provincia: str = Field(sa_column=Column(String(100), nullable=False))
    codigo_postal: str = Field(sa_column=Column(String(20), nullable=False))
    pais: str = Field(
        default="Argentina",
        sa_column=Column(String(100), nullable=False, server_default="Argentina"),
    )
    es_predeterminada: bool = Field(default=False)

    # Relationships
    usuario: Usuario = Relationship(back_populates="direcciones_entrega")

    __table_args__ = (Index("idx_direcciones_entrega_usuario_id", "usuario_id"),)
