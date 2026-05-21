"""Database seeding script for initial data population."""

import asyncio
from datetime import datetime, timedelta
from decimal import Decimal
from passlib.context import CryptContext

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlmodel import select

from app.core.config import get_settings
from app.db.models import (
    Usuario,
    Rol,
    UsuarioRol,
    EstadoPedido,
    FormaPago,
)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)


async def seed_database() -> None:
    """Seed the database with initial data.
    
    This function is idempotent and can be run multiple times
    without creating duplicates.
    """
    settings = get_settings()

    # Create async engine
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=False,
        future=True,
    )

    # Create session factory
    async_session = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )

    async with async_session() as session:
        try:
            print("Starting database seeding...")

            # 1. Seed Roles (5 domain roles matching spec)
            roles_data = [
                {
                    "nombre": "admin",
                    "descripcion": "Administrador con acceso completo al sistema",
                },
                {
                    "nombre": "stock",
                    "descripcion": "Gestión de catálogo, productos e ingredientes",
                },
                {
                    "nombre": "pedidos",
                    "descripcion": "Gestión y seguimiento de pedidos",
                },
                {
                    "nombre": "client",
                    "descripcion": "Cliente registrado del e-commerce",
                },
                {
                    "nombre": "cocina",
                    "descripcion": "Visualización y gestión del KDS de cocina",
                },
            ]

            roles = []
            for role_data in roles_data:
                role_res = await session.execute(
                    select(Rol).where(Rol.nombre == role_data["nombre"])
                )
                role = role_res.scalars().first()
                if not role:
                    role = Rol(
                        nombre=role_data["nombre"],
                        descripcion=role_data["descripcion"],
                    )
                    session.add(role)
                roles.append(role)

            await session.flush()
            print(f"✓ Seeded roles (ensured {len(roles_data)} roles exist)")

            # 2. Seed Order States
            estados_data = [
                {
                    "nombre": "pendiente",
                    "descripcion": "Order pending confirmation",
                    "es_final": False,
                },
                {
                    "nombre": "confirmado",
                    "descripcion": "Order confirmed",
                    "es_final": False,
                },
                {
                    "nombre": "en_preparacion",
                    "descripcion": "Order is being prepared",
                    "es_final": False,
                },
                {
                    "nombre": "en_camino",
                    "descripcion": "Order is on the way",
                    "es_final": False,
                },
                {
                    "nombre": "entregado",
                    "descripcion": "Order delivered",
                    "es_final": True,
                },
                {
                    "nombre": "cancelado",
                    "descripcion": "Order cancelled",
                    "es_final": True,
                },
            ]

            estados = []
            for estado_data in estados_data:
                estado_res = await session.execute(
                    select(EstadoPedido).where(EstadoPedido.nombre == estado_data["nombre"])
                )
                estado = estado_res.scalars().first()
                if not estado:
                    estado = EstadoPedido(
                        nombre=estado_data["nombre"],
                        descripcion=estado_data["descripcion"],
                        es_final=estado_data["es_final"],
                    )
                    session.add(estado)
                estados.append(estado)

            await session.flush()
            print(f"✓ Seeded order states")

            # 3. Seed Payment Methods
            formas_pago_data = [
                {
                    "nombre": "mercado_pago",
                    "descripcion": "MercadoPago payment gateway",
                    "activa": True,
                },
                {
                    "nombre": "tarjeta_credito",
                    "descripcion": "Credit card payment",
                    "activa": True,
                },
                {
                    "nombre": "transferencia",
                    "descripcion": "Bank transfer",
                    "activa": True,
                },
            ]

            formas_pago = []
            for forma_data in formas_pago_data:
                forma_res = await session.execute(
                    select(FormaPago).where(FormaPago.nombre == forma_data["nombre"])
                )
                forma = forma_res.scalars().first()
                if not forma:
                    forma = FormaPago(
                        nombre=forma_data["nombre"],
                        descripcion=forma_data["descripcion"],
                        activa=forma_data["activa"],
                    )
                    session.add(forma)
                formas_pago.append(forma)

            await session.flush()
            print(f"✓ Seeded payment methods")

            # 4. Seed Admin User
            admin_email = "admin@foodstore.com"

            # Check if admin already exists
            admin_result = await session.execute(
                select(Usuario).where(Usuario.email == admin_email)
            )
            existing_admin = admin_result.scalars().first()

            if not existing_admin:
                # Find admin role
                admin_role = next((r for r in roles if r.nombre == "admin"), None)
                if not admin_role:
                    res = await session.execute(select(Rol).where(Rol.nombre == "admin"))
                    admin_role = res.scalars().first()

                admin = Usuario(
                    email=admin_email,
                    nombre="Admin",
                    apellido="FoodStore",
                    hashed_password=get_password_hash("Admin1234!"),
                    numero_telefono="+541234567890",
                    activo=True,
                    verificado=True,
                )
                session.add(admin)
                await session.flush()

                # Assign admin role
                usuario_rol = UsuarioRol(
                    usuario_id=admin.id,
                    rol_id=admin_role.id,
                )
                session.add(usuario_rol)
                await session.flush()
                print(f"✓ Created admin user: {admin_email}")
            else:
                print(f"✓ Admin user already exists: {admin_email}")

            # 5. Seed Cocina User
            cocina_email = "cocina@foodstore.com"

            # Check if cocina user already exists
            cocina_result = await session.execute(
                select(Usuario).where(Usuario.email == cocina_email)
            )
            existing_cocina = cocina_result.scalars().first()

            if not existing_cocina:
                # Find cocina role
                cocina_role = next((r for r in roles if r.nombre == "cocina"), None)
                if not cocina_role:
                    res = await session.execute(select(Rol).where(Rol.nombre == "cocina"))
                    cocina_role = res.scalars().first()

                cocina = Usuario(
                    email=cocina_email,
                    nombre="Cocina",
                    apellido="FoodStore",
                    hashed_password=get_password_hash("password"),
                    numero_telefono="+541234567891",
                    activo=True,
                    verificado=True,
                )
                session.add(cocina)
                await session.flush()

                # Assign cocina role
                usuario_rol = UsuarioRol(
                    usuario_id=cocina.id,
                    rol_id=cocina_role.id,
                )
                session.add(usuario_rol)
                await session.flush()
                print(f"✓ Created cocina user: {cocina_email}")
            else:
                print(f"✓ Cocina user already exists: {cocina_email}")

            # Commit all changes
            await session.commit()
            print("✓ Database seeding completed successfully!")

        except Exception as e:
            await session.rollback()
            print(f"✗ Error during seeding: {e}")
            raise
        finally:
            await engine.dispose()


async def main() -> None:
    """Entry point for seeding."""
    await seed_database()


if __name__ == "__main__":
    asyncio.run(main())
