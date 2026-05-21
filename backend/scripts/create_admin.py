"""Script para crear un usuario administrador.

Uso:
    python scripts/create_admin.py
    python scripts/create_admin.py --email otro@mail.com --password OtraPass1!

Es idempotente: si el usuario ya existe, solo le asegura el rol admin.
"""

import asyncio
import argparse
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlmodel import select

from app.core.config import get_settings
from app.db.models import Usuario, Rol, UsuarioRol

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


async def create_admin(email: str, password: str, nombre: str, apellido: str) -> None:
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
            # 1. Buscar o crear el rol admin
            rol_result = await session.execute(
                select(Rol).where(Rol.nombre == "admin")
            )
            rol_admin = rol_result.scalars().first()

            if not rol_admin:
                rol_admin = Rol(
                    nombre="admin",
                    descripcion="Administrador con acceso completo al sistema",
                )
                session.add(rol_admin)
                await session.flush()
                print(f"✓ Rol 'admin' creado (id={rol_admin.id})")
            else:
                print(f"✓ Rol 'admin' encontrado (id={rol_admin.id})")

            # 2. Buscar o crear el usuario
            usuario_result = await session.execute(
                select(Usuario).where(Usuario.email == email)
            )
            usuario = usuario_result.scalars().first()

            if not usuario:
                usuario = Usuario(
                    email=email,
                    nombre=nombre,
                    apellido=apellido,
                    hashed_password=hash_password(password),
                    activo=True,
                    verificado=True,
                )
                session.add(usuario)
                await session.flush()
                print(f"✓ Usuario creado: {email}")
            else:
                print(f"✓ Usuario ya existe: {email} (id={usuario.id})")

            # 3. Asegurarse de que tiene el rol admin
            rol_asignado_result = await session.execute(
                select(UsuarioRol).where(
                    UsuarioRol.usuario_id == usuario.id,
                    UsuarioRol.rol_id == rol_admin.id,
                )
            )
            ya_tiene_rol = rol_asignado_result.scalars().first()

            if not ya_tiene_rol:
                usuario_rol = UsuarioRol(
                    usuario_id=usuario.id,
                    rol_id=rol_admin.id,
                )
                session.add(usuario_rol)
                await session.flush()
                print(f"✓ Rol 'admin' asignado a {email}")
            else:
                print(f"✓ {email} ya tiene el rol 'admin'")

            await session.commit()
            print("\n✅ Admin listo.")
            print(f"   Email:    {email}")
            print(f"   Password: {password}")

        except Exception as e:
            await session.rollback()
            print(f"✗ Error: {e}")
            raise
        finally:
            await engine.dispose()


def main() -> None:
    parser = argparse.ArgumentParser(description="Crear usuario administrador")
    parser.add_argument(
        "--email",
        default="admin@foodstore.com",
        help="Email del admin (default: admin@foodstore.com)",
    )
    parser.add_argument(
        "--password",
        default="Admin1234!",
        help="Contraseña del admin (default: Admin1234!)",
    )
    parser.add_argument(
        "--nombre",
        default="Admin",
        help="Nombre (default: Admin)",
    )
    parser.add_argument(
        "--apellido",
        default="FoodStore",
        help="Apellido (default: FoodStore)",
    )
    args = parser.parse_args()

    asyncio.run(create_admin(args.email, args.password, args.nombre, args.apellido))


if __name__ == "__main__":
    main()
