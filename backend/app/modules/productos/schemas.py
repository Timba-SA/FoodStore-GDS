"""Pydantic schemas for the Productos module."""

from decimal import Decimal
from typing import Literal, Optional
from datetime import datetime

from pydantic import BaseModel, field_validator


# ---------------------------------------------------------------------------
# Nested read schemas (inline to avoid circular imports)
# ---------------------------------------------------------------------------

class CategoriaInline(BaseModel):
    id: int
    nombre: str
    slug: str
    imagen_url: Optional[str] = None

    model_config = {"from_attributes": True}


class IngredienteInline(BaseModel):
    id: int
    nombre: str
    es_alergeno: bool

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Write schemas
# ---------------------------------------------------------------------------

class ProductoCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    precio: Decimal
    stock: int = 0
    sku: str
    imagen_url: Optional[str] = None
    activo: bool = True
    es_alergeno: bool = False
    categoria_ids: list[int] = []
    ingrediente_ids: list[int] = []

    @field_validator("nombre")
    @classmethod
    def nombre_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("nombre cannot be empty")
        return v.strip()

    @field_validator("precio")
    @classmethod
    def precio_positivo(cls, v: Decimal) -> Decimal:
        if v < 0:
            raise ValueError("precio must be >= 0")
        return v

    @field_validator("stock")
    @classmethod
    def stock_non_negative(cls, v: int) -> int:
        if v < 0:
            raise ValueError("stock must be >= 0")
        return v

    @field_validator("sku")
    @classmethod
    def sku_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("sku cannot be empty")
        return v.strip().upper()


class ProductoUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    precio: Optional[Decimal] = None
    stock: Optional[int] = None
    sku: Optional[str] = None
    imagen_url: Optional[str] = None
    activo: Optional[bool] = None
    es_alergeno: Optional[bool] = None
    categoria_ids: Optional[list[int]] = None
    ingrediente_ids: Optional[list[int]] = None

    @field_validator("precio")
    @classmethod
    def precio_positivo(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None and v < 0:
            raise ValueError("precio must be >= 0")
        return v

    @field_validator("stock")
    @classmethod
    def stock_non_negative(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v < 0:
            raise ValueError("stock must be >= 0")
        return v


class ProductoStockUpdate(BaseModel):
    """Update product stock. operacion: 'add' | 'subtract' | 'set'."""
    cantidad: int
    operacion: Literal["add", "subtract", "set"] = "set"

    @field_validator("cantidad")
    @classmethod
    def cantidad_valid(cls, v: int) -> int:
        if v < 0:
            raise ValueError("cantidad must be >= 0")
        return v


# ---------------------------------------------------------------------------
# Read schemas
# ---------------------------------------------------------------------------

class ProductoResponse(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str]
    precio: Decimal
    stock: int
    sku: str
    imagen_url: Optional[str]
    activo: bool
    es_alergeno: bool
    deleted_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    categorias: list[CategoriaInline] = []
    ingredientes: list[IngredienteInline] = []

    model_config = {"from_attributes": True}
