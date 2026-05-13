"""Authentication service for user registration and token management."""

from datetime import datetime, timedelta, timezone
from typing import Optional
import uuid
import hashlib

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from passlib.context import CryptContext
from jose import JWTError, jwt

from app.core.config import get_settings
from app.db.models.usuario import Usuario, Rol, UsuarioRol, RefreshToken
from app.modules.auth.schemas import (
    RegisterRequest,
    TokenResponse,
    UserResponse,
    TokenPayload,
)
from app.modules.auth.repository import RefreshTokenRepository


# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    """Authentication service for register, login, refresh, logout and /me."""

    def __init__(self, session: AsyncSession):
        """Initialize auth service with database session."""
        self.session = session
        self.settings = get_settings()
        self.token_repo = RefreshTokenRepository(session)

    # ------------------------------------------------------------------ #
    # Password helpers                                                     #
    # ------------------------------------------------------------------ #

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password with bcrypt."""
        return pwd_context.hash(password)

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its bcrypt hash."""
        return pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def _hash_token(token_value: str) -> str:
        """Return SHA-256 hex digest of a raw token string."""
        return hashlib.sha256(token_value.encode()).hexdigest()

    # ------------------------------------------------------------------ #
    # JWT creation                                                         #
    # ------------------------------------------------------------------ #

    def create_access_token(self, user_id: int, email: str, roles: list[str]) -> str:
        """Create a signed JWT access token (30 min expiry).

        Args:
            user_id: User ID for token payload
            email: User email for token payload
            roles: List of role names for token payload

        Returns:
            JWT token string
        """
        now = datetime.now(timezone.utc)
        expire = now + timedelta(minutes=self.settings.ACCESS_TOKEN_EXPIRE_MINUTES)

        payload = {
            "user_id": user_id,
            "email": email,
            "roles": roles,
            "exp": expire.timestamp(),
            "iat": now.timestamp(),
        }

        return jwt.encode(
            payload,
            self.settings.SECRET_KEY,
            algorithm=self.settings.ALGORITHM,
        )

    async def _create_refresh_token_record(
        self, user_id: int, family_id: Optional[str] = None
    ) -> tuple[str, RefreshToken]:
        """Create and persist a refresh token record.

        Args:
            user_id: User ID to associate with refresh token
            family_id: Optional family ID. If None, a new UUID is generated.

        Returns:
            Tuple of (raw_token_value, RefreshToken DB record)
        """
        if family_id is None:
            family_id = str(uuid.uuid4())

        raw_token = str(uuid.uuid4())
        token_hash = self._hash_token(raw_token)
        expires_at = datetime.now(timezone.utc) + timedelta(
            days=self.settings.REFRESH_TOKEN_EXPIRE_DAYS
        )

        record = RefreshToken(
            usuario_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
            family_id=family_id,
        )

        self.session.add(record)
        await self.session.flush()  # Populate record.id without full commit

        return raw_token, record

    # ------------------------------------------------------------------ #
    # User queries                                                         #
    # ------------------------------------------------------------------ #

    async def get_user_by_email(self, email: str) -> Optional[Usuario]:
        """Get user by email address."""
        result = await self.session.execute(
            select(Usuario).where(Usuario.email == email)
        )
        return result.scalars().first()

    async def get_user_by_id(self, user_id: int) -> Optional[Usuario]:
        """Get user by primary key."""
        result = await self.session.execute(
            select(Usuario).where(Usuario.id == user_id)
        )
        return result.scalars().first()

    async def get_user_roles(self, user_id: int) -> list[str]:
        """Return role name strings for a given user ID."""
        roles_result = await self.session.execute(
            select(Rol)
            .join(UsuarioRol, UsuarioRol.rol_id == Rol.id)
            .where(UsuarioRol.usuario_id == user_id)
        )
        return [role.nombre for role in roles_result.scalars().all()]

    async def _build_user_response(self, user: Usuario) -> UserResponse:
        """Build UserResponse from a Usuario ORM object."""
        roles = await self.get_user_roles(user.id)
        return UserResponse(
            id=user.id,
            nombre=user.nombre,
            email=user.email,
            numero_telefono=user.numero_telefono,
            roles=roles,
            creado_en=user.created_at,
            actualizado_en=user.updated_at,
        )

    # ------------------------------------------------------------------ #
    # Token decoding / validation                                          #
    # ------------------------------------------------------------------ #

    def decode_access_token(self, token: str) -> Optional[TokenPayload]:
        """Decode and validate a JWT access token.

        Returns:
            TokenPayload if valid, None if invalid or expired.
        """
        try:
            payload = jwt.decode(
                token,
                self.settings.SECRET_KEY,
                algorithms=[self.settings.ALGORITHM],
            )

            user_id = payload.get("user_id")
            email = payload.get("email")
            roles = payload.get("roles", [])
            exp = payload.get("exp")

            if not user_id or not email:
                return None

            return TokenPayload(
                user_id=user_id,
                email=email,
                roles=roles,
                exp=exp,
            )
        except JWTError:
            return None

    # ------------------------------------------------------------------ #
    # Auth operations                                                      #
    # ------------------------------------------------------------------ #

    async def login(self, email: str, password: str) -> TokenResponse:
        """Authenticate user and issue access + refresh tokens.

        Args:
            email: User email
            password: Plain text password

        Returns:
            TokenResponse with both tokens and user data

        Raises:
            ValueError: If credentials are invalid
        """
        user = await self.get_user_by_email(email)
        if not user or not self.verify_password(password, user.hashed_password):
            raise ValueError("Invalid credentials")
        if user.deleted_at is not None:
            raise ValueError("Invalid credentials")
        if not user.activo:
            raise ValueError("Cuenta suspendida. Contactá con soporte.")

        roles = await self.get_user_roles(user.id)
        access_token = self.create_access_token(
            user_id=user.id, email=user.email, roles=roles
        )
        raw_refresh, _ = await self._create_refresh_token_record(user_id=user.id)

        user_response = await self._build_user_response(user)
        return TokenResponse(
            access_token=access_token,
            refresh_token=raw_refresh,
            token_type="Bearer",
            user=user_response,
        )

    async def register(self, request: RegisterRequest) -> TokenResponse:
        """Register a new user with CLIENT role and return tokens.

        Args:
            request: RegisterRequest with user data

        Returns:
            TokenResponse with both tokens and user data

        Raises:
            ValueError: If email already registered
        """
        existing_user = await self.get_user_by_email(request.email)
        if existing_user:
            raise ValueError("El email ya está registrado")

        hashed_password = self.hash_password(request.password)
        new_user = Usuario(
            email=request.email,
            nombre=request.nombre,
            apellido=None,  # RegisterRequest does not include apellido
            hashed_password=hashed_password,
            numero_telefono=request.numero_telefono,
            activo=True,
            verificado=False,
        )
        self.session.add(new_user)
        await self.session.flush()

        # Assign CLIENT role (the domain role for registered customers per CHANGES.md)
        roles_result = await self.session.execute(
            select(Rol).where(Rol.nombre == "client")
        )
        client_role = roles_result.scalars().first()
        if not client_role:
            client_role = Rol(nombre="client", descripcion="Cliente registrado del e-commerce")
            self.session.add(client_role)
            await self.session.flush()

        self.session.add(UsuarioRol(usuario_id=new_user.id, rol_id=client_role.id))
        await self.session.flush()

        # Fetch roles from DB (source of truth) instead of hardcoding ["client"]
        roles = await self.get_user_roles(new_user.id)

        access_token = self.create_access_token(
            user_id=new_user.id, email=new_user.email, roles=roles
        )
        raw_refresh, _ = await self._create_refresh_token_record(user_id=new_user.id)

        # Refresh the user object so created_at / updated_at are populated
        await self.session.refresh(new_user)

        user_response = await self._build_user_response(new_user)
        return TokenResponse(
            access_token=access_token,
            refresh_token=raw_refresh,
            token_type="Bearer",
            user=user_response,
        )

    async def refresh(self, raw_token: str) -> TokenResponse:
        """Rotate a refresh token and issue a new token pair.

        Implements rotation + replay detection per design:
        - Valid & not revoked → rotate (revoke old, issue new in same family)
        - Already revoked → replay detected → revoke entire family → 401
        - Expired / not found → 401

        Args:
            raw_token: Raw refresh token string sent by client

        Returns:
            TokenResponse with new access + refresh tokens

        Raises:
            ValueError: On any invalid/revoked/replay scenario
        """
        token_hash = self._hash_token(raw_token)
        record = await self.token_repo.get_by_token_hash(token_hash)

        if not record:
            raise ValueError("Invalid refresh token")

        now = datetime.now(timezone.utc)

        # Expired? (both datetimes are now timezone-aware via base._utcnow)
        if datetime.now(timezone.utc) > record.expires_at:
            raise ValueError("Refresh token expired")

        # Replay detected: token already revoked
        if record.revoked_at is not None:
            # Revoke the entire family to invalidate all sessions from this lineage
            await self.token_repo.revoke_family(record.family_id)
            raise ValueError("Refresh token reuse detected — all sessions revoked")

        # Valid token → rotate
        user = await self.get_user_by_id(record.usuario_id)
        if not user:
            raise ValueError("User not found")

        roles = await self.get_user_roles(user.id)

        # Mark old token as revoked
        await self.token_repo.revoke_family_single(record.id)

        # Issue new token in the same family
        raw_new, new_record = await self._create_refresh_token_record(
            user_id=user.id, family_id=record.family_id
        )

        # Link old → new for audit trail
        await self.token_repo.link_replaced_by(record.id, new_record.id)

        access_token = self.create_access_token(
            user_id=user.id, email=user.email, roles=roles
        )

        user_response = await self._build_user_response(user)
        return TokenResponse(
            access_token=access_token,
            refresh_token=raw_new,
            token_type="Bearer",
            user=user_response,
        )

    async def logout(self, raw_token: str) -> None:
        """Revoke a refresh token on logout.

        Revokes the specific token only (not the full family).
        If token is not found, we still return success (idempotent).

        Args:
            raw_token: Raw refresh token string sent by client
        """
        token_hash = self._hash_token(raw_token)
        record = await self.token_repo.get_by_token_hash(token_hash)

        if record and record.revoked_at is None:
            await self.token_repo.revoke_family_single(record.id)

    async def get_current_user(self, access_token: str) -> Usuario:
        """Validate access token and return the corresponding user.

        Args:
            access_token: Raw JWT access token string

        Returns:
            Usuario ORM object

        Raises:
            ValueError: If token is invalid or user not found/inactive
        """
        payload = self.decode_access_token(access_token)
        if not payload:
            raise ValueError("Invalid or expired access token")

        user = await self.get_user_by_id(payload.user_id)
        if not user:
            raise ValueError("User not found")
        if not user.activo:
            raise ValueError("User account is inactive")

        return user
