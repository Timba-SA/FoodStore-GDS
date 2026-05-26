import asyncio
import sys
import os
from sqlmodel import select
from sqlalchemy.orm import selectinload

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.core.config import get_settings
from app.db.models import Usuario, Rol, UsuarioRol

async def check_user():
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
            print("=============================================================")
            print("CONSULTANDO LA VERDAD ABSOLUTA DE LA BASE DE DATOS FISICA")
            print("=============================================================\n")

            # 1. Buscar todos los usuarios para mapeo general
            all_users_stmt = select(Usuario).options(
                selectinload(Usuario.usuario_roles).selectinload(UsuarioRol.rol)
            )
            all_users_res = await session.execute(all_users_stmt)
            all_users = all_users_res.scalars().all()

            print("--- LISTA DE TODOS LOS USUARIOS REGISTRADOS ---")
            for u in all_users:
                roles_list = [ur.rol.nombre for ur in u.usuario_roles if ur.rol]
                print(f"ID: {u.id} | Email: {u.email} | Nombre: {u.nombre} {u.apellido or ''} | Activo: {u.activo} | Verificado: {u.verificado} | Roles: {roles_list}")
            
            print("\n-----------------------------------------------\n")

            # 2. Focalizar en pedidos@foodstore.com
            target_email = "pedidos@foodstore.com"
            pedidos_stmt = select(Usuario).where(Usuario.email == target_email).options(
                selectinload(Usuario.usuario_roles).selectinload(UsuarioRol.rol)
            )
            pedidos_res = await session.execute(pedidos_stmt)
            pedidos_user = pedidos_res.scalars().first()

            if not pedidos_user:
                print(f"❌ ¡EL USUARIO '{target_email}' NO EXISTE EN LA BASE DE DATOS!")
            else:
                print(f"✅ ¡USUARIO ENCONTRADO!")
                print(f"   ID:            {pedidos_user.id}")
                print(f"   Nombre:        {pedidos_user.nombre}")
                print(f"   Apellido:      {pedidos_user.apellido or 'N/A'}")
                print(f"   Email:         {pedidos_user.email}")
                print(f"   Activo:        {pedidos_user.activo}")
                print(f"   Verificado:    {pedidos_user.verificado}")
                
                # Obtener roles directo de la relacion cargada con selectinload
                roles_asociados = [ur.rol.nombre for ur in pedidos_user.usuario_roles if ur.rol]
                print(f"   Roles (List):  {roles_asociados}")
                
                if not roles_asociados:
                    print("\n⚠️  ¡EL USUARIO TIENE UN ARRAY DE ROLES VACÍO! (roles = [])")
                    # Vamos a ver si existen registros huérfanos en usuario_roles
                    orphan_stmt = select(UsuarioRol).where(UsuarioRol.usuario_id == pedidos_user.id)
                    orphan_res = await session.execute(orphan_stmt)
                    orphans = orphan_res.scalars().all()
                    print(f"   Registros en usuario_roles para este usuario: {len(orphans)}")
                    for o in orphans:
                        print(f"     - ID Rel: {o.id}, Rol ID: {o.rol_id}")

        except Exception as e:
            print(f"❌ Error al consultar la base de datos: {e}")
        finally:
            await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_user())
