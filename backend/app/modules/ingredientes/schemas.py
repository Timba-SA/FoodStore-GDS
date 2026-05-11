"""Pydantic/SQLModel schemas for Ingrediente CRUD."""

from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel


class IngredienteCreate(SQLModel):
    nombre: str
    descripcion: Optional[str] = None
    es_alergeno: bool = False


class IngredienteUpdate(SQLModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    es_alergeno: Optional[bool] = None


class IngredienteResponse(SQLModel):
    id: int
    nombre: str
    descripcion: Optional[str]
    es_alergeno: bool
    deleted_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
