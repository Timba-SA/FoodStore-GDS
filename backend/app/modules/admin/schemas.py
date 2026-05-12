"""
Admin module — Pydantic schemas.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, EmailStr


# ─── Existing ──────────────────────────────────────────────────────────────────
class UpdateRolesRequest(BaseModel):
    roles_ids: list[int] = Field(..., description="List of role IDs to assign to the user")


# ─── User Management ───────────────────────────────────────────────────────────
class UsuarioCreate(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)
    numero_telefono: Optional[str] = None
    roles_ids: list[int] = Field(default=[])


class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = Field(default=None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    numero_telefono: Optional[str] = None
    activo: Optional[bool] = None


class UsuarioListResponse(BaseModel):
    id: int
    nombre: str
    email: str
    numero_telefono: Optional[str]
    activo: bool
    roles: list[str]
    created_at: datetime
    deleted_at: Optional[datetime]

    model_config = {"from_attributes": True}


# ─── Metrics ───────────────────────────────────────────────────────────────────
class TopProducto(BaseModel):
    nombre: str
    cantidad: int


class DashboardMetrics(BaseModel):
    total_pedidos: int
    total_ingresos: float
    pedidos_hoy: int
    ingresos_hoy: float
    top_producto: Optional[TopProducto]


class VentaDelDia(BaseModel):
    fecha: str  # "YYYY-MM-DD"
    ingresos: float


class EstadoPedidoCount(BaseModel):
    estado: str
    cantidad: int


# ─── Profile ───────────────────────────────────────────────────────────────────
class PerfilUpdate(BaseModel):
    nombre: Optional[str] = Field(default=None, min_length=1, max_length=100)
    numero_telefono: Optional[str] = None


class CambiarContrasenaRequest(BaseModel):
    password_actual: str
    password_nueva: str = Field(..., min_length=8)
