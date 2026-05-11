"""Pydantic schemas for the Categorias module."""

from typing import Optional, List
from datetime import datetime

from pydantic import BaseModel, field_validator


class CategoriaCreate(BaseModel):
    """Schema for creating a new category."""

    nombre: str
    descripcion: Optional[str] = None
    slug: Optional[str] = None  # Auto-generated if not provided
    imagen_url: Optional[str] = None
    activa: bool = True
    parent_id: Optional[int] = None

    @field_validator("nombre")
    @classmethod
    def nombre_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("nombre cannot be empty")
        return v.strip()


class CategoriaUpdate(BaseModel):
    """Schema for updating an existing category."""

    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    slug: Optional[str] = None
    imagen_url: Optional[str] = None
    activa: Optional[bool] = None
    parent_id: Optional[int] = None


class CategoriaResponse(BaseModel):
    """Schema for a flat category response."""

    id: int
    nombre: str
    descripcion: Optional[str]
    slug: str
    imagen_url: Optional[str]
    activa: bool
    parent_id: Optional[int]
    creado_en: datetime
    actualizado_en: datetime

    model_config = {"from_attributes": True}


class CategoriaTree(BaseModel):
    """Schema for a hierarchical (tree) category response."""

    id: int
    nombre: str
    descripcion: Optional[str]
    slug: str
    imagen_url: Optional[str]
    activa: bool
    parent_id: Optional[int]
    children: List["CategoriaTree"] = []

    model_config = {"from_attributes": True}


# Required for self-referential model
CategoriaTree.model_rebuild()
