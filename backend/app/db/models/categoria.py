"""Product category model"""

from typing import Optional

from sqlmodel import Field, Relationship, Column, String
from sqlalchemy import Index

from app.db.base import BaseModel


class Categoria(BaseModel, table=True):
    """Product category model."""

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

    # Relationships
    productos_categorias: list["ProductoCategoria"] = Relationship(
        back_populates="categoria"
    )

    __table_args__ = (
        Index("idx_categorias_nombre", "nombre"),
        Index("idx_categorias_slug", "slug"),
        Index("idx_categorias_activa", "activa"),
    )
