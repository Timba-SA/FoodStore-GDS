"""
AdminService — User CRUD operations.

All writes go through flush + caller commits.
Soft delete uses the BaseModel.deleted_at field (AuditMixin pattern).
"""

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.models import Usuario, Rol, UsuarioRol
from app.modules.auth.service import AuthService
from app.modules.admin.schemas import UsuarioCreate, UsuarioUpdate


class AdminService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self._auth = AuthService(session)

    # ── Role management (existing) ─────────────────────────────────────────────

    async def update_user_roles(
        self, user_id: int, roles_names: list[str], current_admin_id: int
    ) -> Usuario:
        user_result = await self.session.execute(select(Usuario).where(Usuario.id == user_id))
        user = user_result.scalars().first()
        if not user:
            raise ValueError("User not found")

        roles_result = await self.session.execute(select(Rol).where(Rol.nombre.in_(roles_names)))
        valid_roles = roles_result.scalars().all()
        if len(valid_roles) != len(roles_names):
            raise ValueError("One or more roles are invalid")

        if user_id == current_admin_id:
            has_admin_role = any(r.nombre == "admin" for r in valid_roles)
            if not has_admin_role:
                admin_count_query = select(func.count(UsuarioRol.id)).join(Rol).where(
                    Rol.nombre == "admin"
                )
                count_result = await self.session.execute(admin_count_query)
                total_admins = count_result.scalar()
                if total_admins <= 1:
                    raise ValueError("Cannot remove the last admin role from the system")

        old_roles_result = await self.session.execute(
            select(UsuarioRol).where(UsuarioRol.usuario_id == user_id)
        )
        for old_role in old_roles_result.scalars().all():
            await self.session.delete(old_role)

        for role in valid_roles:
            self.session.add(UsuarioRol(usuario_id=user_id, rol_id=role.id))

        await self.session.flush()
        return user

    # ── User CRUD ──────────────────────────────────────────────────────────────

    async def list_users(
        self,
        skip: int = 0,
        limit: int = 50,
        include_deleted: bool = False,
    ) -> list[Usuario]:
        """List users with optional pagination. By default, excludes soft-deleted users."""
        q = select(Usuario)
        if not include_deleted:
            q = q.where(Usuario.deleted_at.is_(None))
        q = q.order_by(Usuario.created_at.desc()).offset(skip).limit(limit)
        result = await self.session.execute(q)
        return list(result.scalars().all())

    async def get_user(self, user_id: int) -> Optional[Usuario]:
        result = await self.session.execute(select(Usuario).where(Usuario.id == user_id))
        return result.scalars().first()

    async def create_user(self, data: UsuarioCreate) -> Usuario:
        """Create a user manually from the admin panel, hashing the password."""
        existing = await self._auth.get_user_by_email(data.email)
        if existing and existing.deleted_at is None:
            raise ValueError(f"El email '{data.email}' ya está registrado.")

        user = Usuario(
            nombre=data.nombre,
            apellido="",
            email=data.email,
            hashed_password=AuthService.hash_password(data.password),
            numero_telefono=data.numero_telefono,
            activo=True,
            verificado=True,  # Manual creation → consider verified
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        self.session.add(user)
        await self.session.flush()

        # Assign roles (default: client if none given)
        role_ids = data.roles_ids or []
        if not role_ids:
            client_result = await self.session.execute(
                select(Rol).where(Rol.nombre == "client")
            )
            client_role = client_result.scalars().first()
            if client_role:
                role_ids = [client_role.id]

        for rid in role_ids:
            self.session.add(UsuarioRol(usuario_id=user.id, rol_id=rid))

        await self.session.flush()
        return user

    async def update_user(self, user_id: int, data: UsuarioUpdate) -> Usuario:
        """Update mutable user fields. Email uniqueness is enforced."""
        user = await self.get_user(user_id)
        if not user or user.deleted_at is not None:
            raise ValueError("Usuario no encontrado.")

        if data.nombre is not None:
            user.nombre = data.nombre
        if data.numero_telefono is not None:
            user.numero_telefono = data.numero_telefono
        if data.activo is not None:
            user.activo = data.activo
        if data.email is not None and data.email != user.email:
            existing = await self._auth.get_user_by_email(data.email)
            if existing and existing.id != user_id and existing.deleted_at is None:
                raise ValueError(f"El email '{data.email}' ya está en uso.")
            user.email = data.email

        user.updated_at = datetime.utcnow()
        await self.session.flush()
        return user

    async def soft_delete_user(self, user_id: int, current_admin_id: int) -> None:
        """Deactivate a user (sets activo = False). Cannot deactivate yourself."""
        if user_id == current_admin_id:
            raise ValueError("No podés desactivar tu propio usuario.")

        user = await self.get_user(user_id)
        if not user:
            raise ValueError("Usuario no encontrado.")

        user.activo = False
        user.updated_at = datetime.utcnow()
        await self.session.flush()

    async def get_deleted_records(self) -> dict:
        """Return a summary of soft-deleted records across audited tables."""
        users_q = select(Usuario).where(Usuario.deleted_at.is_not(None))
        users_result = await self.session.execute(users_q)
        deleted_users = users_result.scalars().all()
        return {
            "usuarios": [
                {"id": u.id, "nombre": u.nombre, "email": u.email, "deleted_at": u.deleted_at}
                for u in deleted_users
            ]
        }
