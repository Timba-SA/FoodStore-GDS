"""Script para sembrar datos de lookup: estados de pedido, formas de pago y roles base.

Es idempotente: solo inserta lo que aún no existe.

Uso:
    docker compose exec backend python scripts/seed_lookup.py
"""

import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlmodel import select

from app.core.config import get_settings
from app.db.models import Rol, EstadoPedido, FormaPago


async def seed_lookup() -> None:
    settings = get_settings()
    engine = create_async_engine(settings.DATABASE_URL, echo=False, future=True)
    async_session = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )

    async with async_session() as session:
        try:
            # ── 1. Roles ─────────────────────────────────────────────────────────
            roles_data = [
                {"nombre": "admin",   "descripcion": "Administrador con acceso completo al sistema"},
                {"nombre": "stock",   "descripcion": "Gestión de catálogo, productos e ingredientes"},
                {"nombre": "pedidos", "descripcion": "Gestión y seguimiento de pedidos"},
                {"nombre": "client",  "descripcion": "Cliente registrado del e-commerce"},
            ]

            roles_creados = 0
            for r in roles_data:
                result = await session.execute(select(Rol).where(Rol.nombre == r["nombre"]))
                if not result.scalars().first():
                    session.add(Rol(**r))
                    roles_creados += 1

            await session.flush()
            print(f"✓ Roles: {roles_creados} creados (el resto ya existía)")

            # ── 2. Estados de pedido ──────────────────────────────────────────────
            estados_data = [
                {"nombre": "pendiente",       "descripcion": "Pedido pendiente de confirmación", "es_final": False},
                {"nombre": "confirmado",      "descripcion": "Pedido confirmado",                "es_final": False},
                {"nombre": "en_preparacion",  "descripcion": "Pedido en preparación",            "es_final": False},
                {"nombre": "en_camino",       "descripcion": "Pedido en camino",                 "es_final": False},
                {"nombre": "entregado",       "descripcion": "Pedido entregado",                 "es_final": True},
                {"nombre": "cancelado",       "descripcion": "Pedido cancelado",                 "es_final": True},
            ]

            estados_creados = 0
            for e in estados_data:
                result = await session.execute(
                    select(EstadoPedido).where(EstadoPedido.nombre == e["nombre"])
                )
                if not result.scalars().first():
                    session.add(EstadoPedido(**e))
                    estados_creados += 1

            await session.flush()
            print(f"✓ Estados de pedido: {estados_creados} creados (el resto ya existía)")

            # ── 3. Formas de pago ─────────────────────────────────────────────────
            formas_data = [
                {"nombre": "mercado_pago",    "descripcion": "MercadoPago",      "activa": True},
                {"nombre": "tarjeta_credito", "descripcion": "Tarjeta de crédito", "activa": True},
                {"nombre": "transferencia",   "descripcion": "Transferencia bancaria", "activa": True},
            ]

            formas_creadas = 0
            for f in formas_data:
                result = await session.execute(
                    select(FormaPago).where(FormaPago.nombre == f["nombre"])
                )
                if not result.scalars().first():
                    session.add(FormaPago(**f))
                    formas_creadas += 1

            await session.flush()
            print(f"✓ Formas de pago: {formas_creadas} creadas (el resto ya existía)")

            await session.commit()
            print("\n✅ Seed de lookup completado.")

        except Exception as e:
            await session.rollback()
            print(f"✗ Error: {e}")
            raise
        finally:
            await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_lookup())
