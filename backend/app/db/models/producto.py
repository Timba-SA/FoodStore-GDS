"""Product, ingredient, and related models"""

from typing import Optional
from decimal import Decimal

from sqlmodel import Field, Relationship, Column, String, Numeric, Text, Integer
from sqlalchemy import Index

from app.db.base import BaseModel


class Producto(BaseModel, table=True):
    """Product model."""

    __tablename__ = "productos"

    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(
        sa_column=Column(String(255), nullable=False),
        description="Product name",
    )
    descripcion: Optional[str] = Field(
        default=None,
        sa_column=Column(Text),
        description="Product description",
    )
    precio: Decimal = Field(
        sa_column=Column(Numeric(10, 2), nullable=False),
        description="Product price",
    )
    stock: int = Field(
        default=0,
        description="Available stock quantity",
    )
    sku: str = Field(
        sa_column=Column(String(100), unique=True, nullable=False),
        description="Stock Keeping Unit",
    )
    imagen_url: Optional[str] = Field(
        default=None,
        sa_column=Column(String(500)),
        description="Product image URL",
    )
    activo: bool = Field(
        default=True,
        description="Whether product is available for sale",
    )
    es_alergeno: bool = Field(
        default=False,
        description="Whether product is manually marked as allergen",
    )

    # Relationships
    productos_categorias: list["ProductoCategoria"] = Relationship(
        back_populates="producto"
    )
    productos_ingredientes: list["ProductoIngrediente"] = Relationship(
        back_populates="producto"
    )
    detalles_pedido: list["DetallePedido"] = Relationship(back_populates="producto")

    __table_args__ = (
        Index("idx_productos_sku", "sku"),
        Index("idx_productos_nombre", "nombre"),
        Index("idx_productos_activo", "activo"),
        Index("idx_productos_es_alergeno", "es_alergeno"),
    )


class Ingrediente(BaseModel, table=True):
    """Ingredient model for products."""

    __tablename__ = "ingredientes"

    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(
        sa_column=Column(String(100), unique=True, nullable=False),
        description="Ingredient name",
    )
    descripcion: Optional[str] = Field(
        default=None,
        description="Ingredient description",
    )
    es_alergeno: bool = Field(
        default=False,
        description="Whether this ingredient is a known allergen",
    )

    # Relationships
    productos_ingredientes: list["ProductoIngrediente"] = Relationship(
        back_populates="ingrediente"
    )

    __table_args__ = (
        Index("idx_ingredientes_nombre", "nombre"),
        Index("idx_ingredientes_es_alergeno", "es_alergeno"),
    )


class ProductoCategoria(BaseModel, table=True):
    """Product-Category association model."""

    __tablename__ = "productos_categorias"

    id: Optional[int] = Field(default=None, primary_key=True)
    producto_id: int = Field(
        foreign_key="productos.id",
        nullable=False,
        description="Producto ID",
    )
    categoria_id: int = Field(
        foreign_key="categorias.id",
        nullable=False,
        description="Categoria ID",
    )

    # Relationships
    producto: Producto = Relationship(back_populates="productos_categorias")
    categoria: "Categoria" = Relationship(back_populates="productos_categorias")

    __table_args__ = (
        Index(
            "idx_productos_categorias_producto_id_categoria_id",
            "producto_id",
            "categoria_id",
        ),
    )


class ProductoIngrediente(BaseModel, table=True):
    """Product-Ingredient association model."""

    __tablename__ = "productos_ingredientes"

    id: Optional[int] = Field(default=None, primary_key=True)
    producto_id: int = Field(
        foreign_key="productos.id",
        nullable=False,
        description="Producto ID",
    )
    ingrediente_id: int = Field(
        foreign_key="ingredientes.id",
        nullable=False,
        description="Ingrediente ID",
    )

    # Relationships
    producto: Producto = Relationship(back_populates="productos_ingredientes")
    ingrediente: Ingrediente = Relationship(back_populates="productos_ingredientes")

    __table_args__ = (
        Index(
            "idx_productos_ingredientes_producto_id_ingrediente_id",
            "producto_id",
            "ingrediente_id",
        ),
    )
