"""Pydantic schemas for the Direcciones module."""

from typing import Optional
from pydantic import BaseModel, field_validator


class DireccionCreate(BaseModel):
    calle: str
    numero: str
    departamento: Optional[str] = None
    ciudad: str
    provincia: str
    codigo_postal: str
    pais: str = "Argentina"
    es_predeterminada: bool = False

    @field_validator("calle", "numero", "ciudad", "provincia", "codigo_postal")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Este campo no puede estar vacío")
        return v.strip()

    @field_validator("pais")
    @classmethod
    def pais_not_empty(cls, v: str) -> str:
        if not v.strip():
            return "Argentina"
        return v.strip()


class DireccionUpdate(BaseModel):
    calle: Optional[str] = None
    numero: Optional[str] = None
    departamento: Optional[str] = None
    ciudad: Optional[str] = None
    provincia: Optional[str] = None
    codigo_postal: Optional[str] = None
    pais: Optional[str] = None
    es_predeterminada: Optional[bool] = None


class DireccionResponse(BaseModel):
    id: int
    usuario_id: int
    calle: str
    numero: str
    departamento: Optional[str]
    ciudad: str
    provincia: str
    codigo_postal: str
    pais: str
    es_predeterminada: bool

    model_config = {"from_attributes": True}
