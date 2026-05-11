"""Product category model"""

from typing import Optional, List

from sqlmodel import Field, Relationship, Column, String, Integer
from sqlalchemy import Index, ForeignKey
from sqlalchemy.orm import relationship

from app.db.base import BaseModel


class Categoria(BaseModel, table=True):
    """Product category model with hierarchical support."""

    __tablename__ = "categorias"

    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(
        sa_column=Column(String(100), unique=True, nullable=False),
        description="Category name",
    )
    descripcion: Optional[str] = Field(
        default=None,
        description="Category description",
    )
    slug: str = Field(
        sa_column=Column(String(100), unique=True, nullable=False),
        description="URL-friendly slug",
    )
    imagen_url: Optional[str] = Field(
        default=None,
        sa_column=Column(String(500)),
        description="Category image URL",
    )
    activa: bool = Field(
        default=True,
        description="Whether category is active",
    )
    parent_id: Optional[int] = Field(
        default=None,
        sa_column=Column(Integer, ForeignKey("categorias.id"), nullable=True),
        description="Parent category ID for hierarchy",
    )

    # Self-referential relationships
    children: List["Categoria"] = Relationship(
        sa_relationship=relationship(
            "Categoria",
            back_populates="parent",
            foreign_keys="[Categoria.parent_id]",
            lazy="selectin",
        )
    )
    parent: Optional["Categoria"] = Relationship(
        sa_relationship=relationship(
            "Categoria",
            back_populates="children",
            foreign_keys="[Categoria.parent_id]",
            remote_side="[Categoria.id]",
        )
    )

    # Relationships to other models
    productos_categorias: list["ProductoCategoria"] = Relationship(
        back_populates="categoria"
    )

    __table_args__ = (
        Index("idx_categorias_nombre", "nombre"),
        Index("idx_categorias_slug", "slug"),
        Index("idx_categorias_activa", "activa"),
        Index("idx_categorias_parent_id", "parent_id"),
    )
