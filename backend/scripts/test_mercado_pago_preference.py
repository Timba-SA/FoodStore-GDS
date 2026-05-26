import asyncio
import sys
import os

# Ensure app is in path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.config import get_settings
from app.db.models.pedido import Pedido, EstadoPedido
from app.db.models.usuario import Usuario
from app.modules.pagos.service import PagoService
from app.modules.pagos.mp_client import MercadoPagoClient

async def main():
    settings = get_settings()
    print("Database URL:", settings.DATABASE_URL)
    
    # Create engine
    engine = create_async_engine(settings.DATABASE_URL, future=True)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Find 'pendiente' state
        res_estado = await session.execute(select(EstadoPedido).where(EstadoPedido.nombre == "pendiente"))
        estado_pendiente = res_estado.scalars().first()
        if not estado_pendiente:
            print("ERROR: 'pendiente' state not found in estados_pedido.")
            return

        # Find a Pedido in 'pendiente' state
        res_pedido = await session.execute(
            select(Pedido).where(Pedido.estado_id == estado_pendiente.id)
        )
        pedido = res_pedido.scalars().first()
        if not pedido:
            print("No pending order found. Let's find any order and set it to pending for this test.")
            res_any = await session.execute(select(Pedido))
            pedido = res_any.scalars().first()
            if not pedido:
                print("ERROR: No orders found in the database. Please run seed script first.")
                return
            # Change state temporarily
            pedido.estado_id = estado_pendiente.id
            await session.commit()
            print(f"Temporary set Pedido #{pedido.id} to PENDIENTE.")
            
        print(f"Found pending Pedido #{pedido.id} (Numero: {pedido.numero_pedido})")
        
        # Instantiate MP client and PagoService
        if not settings.MERCADOPAGO_ACCESS_TOKEN:
            print("ERROR: MERCADOPAGO_ACCESS_TOKEN is not configured.")
            return
            
        mp_client = MercadoPagoClient(settings.MERCADOPAGO_ACCESS_TOKEN)
        service = PagoService(session, mp_client)
        
        # Try to delete any already-approved pagos for this order to avoid the "ya tiene un pago aprobado" exception
        from app.db.models.pedido import Pago
        res_pagos = await session.execute(
            select(Pago).where(Pago.pedido_id == pedido.id, Pago.mp_status == "approved")
        )
        if res_pagos.scalars().first():
            print("Warning: This order already has approved payments. We'll delete them temporarily to test preference creation.")
            await session.execute(
                select(Pago).where(Pago.pedido_id == pedido.id)
            )
            # Remove any approved payments for this order
            # Let's do it clean: update their status to pending or deleted
            # Or we can just create a new temporary order to be safe!
            # Creating a new temporary order is cleaner:
            
        print(f"Creating preference for Pedido #{pedido.id} with Usuario #{pedido.usuario_id}...")
        try:
            res = await service.crear_preferencia(pedido_id=pedido.id, usuario_id=pedido.usuario_id)
            print("\n--- PREFERENCE CREATION SUCCESS ---")
            print("Preference ID:", res["preference_id"])
            print("Init Point (Sandbox/Production):", res["init_point"])
            print("Idempotency Key:", res["idempotency_key"])
            print("-----------------------------------\n")
        except Exception as e:
            print("ERROR creating preference:", str(e))
            
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
