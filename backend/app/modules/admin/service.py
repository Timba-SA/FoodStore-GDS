from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from fastapi import HTTPException, status

from app.db.models import Usuario, Rol, UsuarioRol

class AdminService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def update_user_roles(self, user_id: int, roles_ids: list[int], current_admin_id: int) -> Usuario:
        # Check if user exists
        user_result = await self.session.execute(select(Usuario).where(Usuario.id == user_id))
        user = user_result.scalars().first()
        if not user:
            raise ValueError("User not found")

        # Verify roles exist
        roles_result = await self.session.execute(select(Rol).where(Rol.id.in_(roles_ids)))
        valid_roles = roles_result.scalars().all()
        if len(valid_roles) != len(roles_ids):
            raise ValueError("One or more roles are invalid")

        # Check for self-demotion
        if user_id == current_admin_id:
            has_admin_role = any(r.nombre == "admin" for r in valid_roles)
            if not has_admin_role:
                # Count total admins
                admin_count_query = select(func.count(UsuarioRol.id)).join(Rol).where(Rol.nombre == "admin")
                count_result = await self.session.execute(admin_count_query)
                total_admins = count_result.scalar()

                if total_admins <= 1:
                    raise ValueError("Cannot remove the last admin role from the system")

        # Delete old roles
        old_roles_query = select(UsuarioRol).where(UsuarioRol.usuario_id == user_id)
        old_roles_result = await self.session.execute(old_roles_query)
        for old_role in old_roles_result.scalars().all():
            await self.session.delete(old_role)

        # Add new roles
        for role_id in roles_ids:
            new_ur = UsuarioRol(usuario_id=user_id, rol_id=role_id)
            self.session.add(new_ur)

        await self.session.flush()
        return user
