import asyncio
from sqlmodel import select
from app.db.models.producto import Producto
from app.modules.productos.service import ProductoService
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import get_settings

async def main():
    settings = get_settings()
    # Replace DB url to use the internal docker compose name or the exact URL
    db_url = settings.DATABASE_URL
    print(f"Connecting to DB: {db_url}")
    engine = create_async_engine(db_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # 1. Query raw database values
        stmt = select(Producto)
        res = await session.execute(stmt)
        products = res.scalars().all()
        print("=== Raw DB Products ===")
        for p in products:
            print(f"ID: {p.id} | Nombre: {p.nombre} | Activo: {p.activo} | Disponible: {p.disponible} | DeletedAt: {p.deleted_at}")
            
        # 2. Call service get_all with only_available=False
        service = ProductoService(session)
        res_service = await service.get_all(include_inactive=False, only_available=False, limit=100)
        print("\n=== Service get_all (only_available=False) ===")
        for p in res_service:
            print(f"ID: {p.id} | Nombre: {p.nombre} | Disponible: {p.disponible}")

if __name__ == "__main__":
    asyncio.run(main())
