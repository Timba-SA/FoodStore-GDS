"""
Pydantic schemas for the Pedidos module.
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field


# ─── Request Schemas ────────────────────────────────────────────────────────

class CartItemPayload(BaseModel):
    """A single item from the client-side cart used to create an order."""
    producto_id: int
    cantidad: int = Field(ge=1)
    personalizacion: list[int] = Field(default_factory=list)


class PedidoCreate(BaseModel):
    """Payload for creating a new order from the cart."""
    direccion_entrega_id: int
    items: list[CartItemPayload] = Field(min_length=1)
    notas: Optional[str] = None


class EstadoUpdate(BaseModel):
    """Payload to advance the order's state."""
    nuevo_estado: str  # e.g. "confirmado", "en_preparacion", etc.
    nota: Optional[str] = None


# ─── Response Schemas ────────────────────────────────────────────────────────

class DetallePedidoResponse(BaseModel):
    id: int
    producto_id: int
    nombre_snapshot: Optional[str]
    cantidad: int
    precio_unitario: Decimal
    subtotal: Decimal
    personalizacion: Optional[list[int]]

    model_config = {"from_attributes": True}


class HistorialEstadoResponse(BaseModel):
    id: int
    estado_nombre: str
    fecha_cambio: datetime
    usuario_id: Optional[int]
    nota: Optional[str]

    model_config = {"from_attributes": True}


class PedidoResponse(BaseModel):
    id: int
    usuario_id: int
    numero_pedido: str
    estado_nombre: str
    subtotal: Decimal
    impuestos: Decimal
    costo_envio: Decimal
    total: Decimal
    direccion_entrega_id: Optional[int]
    direccion_snapshot: Optional[dict]
    notas: Optional[str]
    created_at: datetime
    detalles: list[DetallePedidoResponse] = []
    historial: list[HistorialEstadoResponse] = []

    model_config = {"from_attributes": True}


class PedidoListResponse(BaseModel):
    """Compact representation for listing orders."""
    id: int
    numero_pedido: str
    estado_nombre: str
    total: Decimal
    created_at: datetime

    model_config = {"from_attributes": True}
