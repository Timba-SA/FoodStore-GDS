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

            # Check if data already exists
            roles_result = await session.execute(select(Rol))
            existing_roles = roles_result.scalars().all()

            if existing_roles:
                print("Database already seeded. Skipping...")
                return

            # 1. Seed Roles (4 domain roles matching CHANGES.md spec)
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
            ]

            roles = []
            for role_data in roles_data:
                role = Rol(
                    nombre=role_data["nombre"],
                    descripcion=role_data["descripcion"],
                )
                session.add(role)
                roles.append(role)

            await session.flush()
            print(f"✓ Created {len(roles)} roles")

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
                    "nombre": "enviado",
                    "descripcion": "Order shipped",
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
                {
                    "nombre": "devuelto",
                    "descripcion": "Order returned",
                    "es_final": True,
                },
            ]

            estados = []
            for estado_data in estados_data:
                estado = EstadoPedido(
                    nombre=estado_data["nombre"],
                    descripcion=estado_data["descripcion"],
                    es_final=estado_data["es_final"],
                )
                session.add(estado)
                estados.append(estado)

            await session.flush()
            print(f"✓ Created {len(estados)} order states")

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
                forma = FormaPago(
                    nombre=forma_data["nombre"],
                    descripcion=forma_data["descripcion"],
                    activa=forma_data["activa"],
                )
                session.add(forma)
                formas_pago.append(forma)

            await session.flush()
            print(f"✓ Created {len(formas_pago)} payment methods")

            # 4. Seed Admin User
            admin_email = "admin@foodstore.com"

            # Check if admin already exists
            admin_result = await session.execute(
                select(Usuario).where(Usuario.email == admin_email)
            )
            existing_admin = admin_result.scalars().first()

            if not existing_admin:
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
                admin_role = roles[0]  # admin role
                usuario_rol = UsuarioRol(
                    usuario_id=admin.id,
                    rol_id=admin_role.id,
                )
                session.add(usuario_rol)
                await session.flush()
                print(f"✓ Created admin user: {admin_email}")
            else:
                print(f"✓ Admin user already exists: {admin_email}")

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
