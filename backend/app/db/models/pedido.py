"""Order, payment, and related models"""

from typing import Optional
from decimal import Decimal
from enum import Enum
from datetime import datetime

from sqlmodel import Field, Relationship, Column, String, Numeric, Text, DateTime, Enum as SQLEnum
from sqlalchemy import Index, JSON

from app.db.base import BaseModel


class FormaPagoEnum(str, Enum):
    """Payment method enumeration."""

    MERCADO_PAGO = "mercado_pago"
    TARJETA_CREDITO = "tarjeta_credito"
    TARJETA_DEBITO = "tarjeta_debito"
    TRANSFERENCIA = "transferencia"
    EFECTIVO = "efectivo"


class EstadoPedidoEnum(str, Enum):
    """Order status enumeration."""

    PENDIENTE = "pendiente"
    CONFIRMADO = "confirmado"
    ENVIADO = "enviado"
    ENTREGADO = "entregado"
    CANCELADO = "cancelado"
    DEVUELTO = "devuelto"


class FormaPago(BaseModel, table=True):
    """Payment method model."""

    __tablename__ = "formas_pago"

    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(
        sa_column=Column(String(50), unique=True, nullable=False),
        description="Payment method name",
    )
    descripcion: Optional[str] = Field(
        default=None,
        description="Payment method description",
    )
    activa: bool = Field(
        default=True,
        description="Whether payment method is available",
    )

    # Relationships
    pagos: list["Pago"] = Relationship(back_populates="forma_pago")

    __table_args__ = (Index("idx_formas_pago_nombre", "nombre"),)


class EstadoPedido(BaseModel, table=True):
    """Order status model."""

    __tablename__ = "estados_pedido"

    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(
        sa_column=Column(String(50), unique=True, nullable=False),
        description="Status name",
    )
    descripcion: Optional[str] = Field(
        default=None,
        description="Status description",
    )
    es_final: bool = Field(
        default=False,
        description="Whether this is a final status",
    )

    # Relationships
    historial_estados: list["HistorialEstadoPedido"] = Relationship(
        back_populates="estado"
    )

    __table_args__ = (Index("idx_estados_pedido_nombre", "nombre"),)


class Pedido(BaseModel, table=True):
    """Order model."""

    __tablename__ = "pedidos"

    id: Optional[int] = Field(default=None, primary_key=True)
    usuario_id: int = Field(
        foreign_key="usuarios.id",
        nullable=False,
        description="Usuario ID",
    )
    numero_pedido: str = Field(
        sa_column=Column(String(50), unique=True, nullable=False),
        description="Order number",
    )
    subtotal: Decimal = Field(
        sa_column=Column(Numeric(10, 2), nullable=False),
        description="Order subtotal",
    )
    impuestos: Decimal = Field(
        default=Decimal("0.00"),
        sa_column=Column(Numeric(10, 2), nullable=False),
        description="Total taxes",
    )
    costo_envio: Decimal = Field(
        default=Decimal("0.00"),
        sa_column=Column(Numeric(10, 2), nullable=False),
        description="Shipping cost",
    )
    total: Decimal = Field(
        sa_column=Column(Numeric(10, 2), nullable=False),
        description="Total amount",
    )
    estado_id: int = Field(
        foreign_key="estados_pedido.id",
        nullable=False,
        description="EstadoPedido ID",
    )
    direccion_entrega_id: Optional[int] = Field(
        default=None,
        foreign_key="direcciones_entrega.id",
        description="DireccionEntrega ID",
    )
    # Snapshot of delivery address at order creation (US-038)
    direccion_snapshot: Optional[dict] = Field(
        default=None,
        sa_column=Column(JSON, nullable=True),
        description="Snapshot of delivery address at order time",
    )
    notas: Optional[str] = Field(
        default=None,
        sa_column=Column(Text),
        description="Order notes",
    )

    # Relationships
    usuario: "Usuario" = Relationship(back_populates="pedidos")
    detalles_pedido: list["DetallePedido"] = Relationship(back_populates="pedido")
    historial_estados: list["HistorialEstadoPedido"] = Relationship(
        back_populates="pedido"
    )
    pagos: list["Pago"] = Relationship(back_populates="pedido")

    __table_args__ = (
        Index("idx_pedidos_usuario_id", "usuario_id"),
        Index("idx_pedidos_numero_pedido", "numero_pedido"),
        Index("idx_pedidos_estado_id", "estado_id"),
    )


class DetallePedido(BaseModel, table=True):
    """Order detail/line item model."""

    __tablename__ = "detalles_pedido"

    id: Optional[int] = Field(default=None, primary_key=True)
    pedido_id: int = Field(
        foreign_key="pedidos.id",
        nullable=False,
        description="Pedido ID",
    )
    producto_id: int = Field(
        foreign_key="productos.id",
        nullable=False,
        description="Producto ID",
    )
    cantidad: int = Field(
        nullable=False,
        description="Product quantity",
    )
    precio_unitario: Decimal = Field(
        sa_column=Column(Numeric(10, 2), nullable=False),
        description="Unit price at time of order",
    )
    subtotal: Decimal = Field(
        sa_column=Column(Numeric(10, 2), nullable=False),
        description="Line item subtotal",
    )
    # Snapshots: capture product state at order time (US-037)
    nombre_snapshot: Optional[str] = Field(
        default=None,
        sa_column=Column(String(255), nullable=True),
        description="Product name snapshot at order time",
    )
    # Personalization: excluded ingredient IDs from cart (RN-CR05 / RN-PE05)
    personalizacion: Optional[list] = Field(
        default=None,
        sa_column=Column(JSON, nullable=True),
        description="List of excluded ingredient IDs",
    )

    # Relationships
    pedido: Pedido = Relationship(back_populates="detalles_pedido")
    producto: "Producto" = Relationship(back_populates="detalles_pedido")

    __table_args__ = (
        Index("idx_detalles_pedido_pedido_id", "pedido_id"),
        Index("idx_detalles_pedido_producto_id", "producto_id"),
    )


class HistorialEstadoPedido(BaseModel, table=True):
    """Order status history model."""

    __tablename__ = "historial_estados_pedido"

    id: Optional[int] = Field(default=None, primary_key=True)
    pedido_id: int = Field(
        foreign_key="pedidos.id",
        nullable=False,
        description="Pedido ID",
    )
    estado_id: int = Field(
        foreign_key="estados_pedido.id",
        nullable=False,
        description="EstadoPedido ID (estado_hacia)",
    )
    # Audit: who made the transition (NULL = system)
    usuario_id: Optional[int] = Field(
        default=None,
        foreign_key="usuarios.id",
        nullable=True,
        description="User who triggered the transition (NULL = system)",
    )
    fecha_cambio: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
        description="Status change timestamp",
    )
    nota: Optional[str] = Field(
        default=None,
        sa_column=Column(Text),
        description="Status change note",
    )

    # Relationships
    pedido: Pedido = Relationship(back_populates="historial_estados")
    estado: EstadoPedido = Relationship(back_populates="historial_estados")

    __table_args__ = (
        Index("idx_historial_estados_pedido_pedido_id", "pedido_id"),
        Index("idx_historial_estados_pedido_estado_id", "estado_id"),
    )


class Pago(BaseModel, table=True):
    """Payment model."""

    __tablename__ = "pagos"

    id: Optional[int] = Field(default=None, primary_key=True)
    pedido_id: int = Field(
        foreign_key="pedidos.id",
        nullable=False,
        description="Pedido ID",
    )
    forma_pago_id: int = Field(
        foreign_key="formas_pago.id",
        nullable=False,
        description="FormaPago ID",
    )
    monto: Decimal = Field(
        sa_column=Column(Numeric(10, 2), nullable=False),
        description="Payment amount",
    )
    referencia_externa: Optional[str] = Field(
        default=None,
        sa_column=Column(String(255)),
        description="External payment reference (e.g., MercadoPago ID)",
    )
    estado: str = Field(
        default="pendiente",
        sa_column=Column(String(50), nullable=False),
        description="Payment status",
    )
    metadata_pago: Optional[str] = Field(
        default=None,
        sa_column=Column("metadata", Text),
        description="JSON metadata from payment provider",
    )

    # Relationships
    pedido: Pedido = Relationship(back_populates="pagos")
    forma_pago: FormaPago = Relationship(back_populates="pagos")

    __table_args__ = (
        Index("idx_pagos_pedido_id", "pedido_id"),
        Index("idx_pagos_forma_pago_id", "forma_pago_id"),
        Index("idx_pagos_referencia_externa", "referencia_externa"),
    )
