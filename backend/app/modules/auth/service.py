"""Authentication service for user registration and token management."""

from datetime import datetime, timedelta, timezone
from typing import Optional
import uuid

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


# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    """Authentication service for register, login, and token operations."""

    def __init__(self, session: AsyncSession):
        """Initialize auth service with database session."""
        self.session = session
        self.settings = get_settings()

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password with bcrypt.
        
        Args:
            password: Plain text password
            
        Returns:
            Hashed password
        """
        return pwd_context.hash(password)

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash.
        
        Args:
            plain_password: Plain text password to verify
            hashed_password: Hashed password from database
            
        Returns:
            True if password matches, False otherwise
        """
        return pwd_context.verify(plain_password, hashed_password)

    def create_access_token(self, user_id: int, email: str, roles: list[str]) -> str:
        """Create a JWT access token.
        
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

        encoded_jwt = jwt.encode(
            payload,
            self.settings.SECRET_KEY,
            algorithm=self.settings.ALGORITHM,
        )

        return encoded_jwt

    async def create_refresh_token(self, user_id: int) -> str:
        """Create and store a refresh token.
        
        Args:
            user_id: User ID to associate with refresh token
            
        Returns:
            Refresh token string
        """
        token_value = str(uuid.uuid4())
        expires_at = datetime.now(timezone.utc) + timedelta(
            days=self.settings.REFRESH_TOKEN_EXPIRE_DAYS
        )

        refresh_token = RefreshToken(
            usuario_id=user_id,
            token=token_value,
            expires_at=expires_at,
            is_revoked=False,
        )

        self.session.add(refresh_token)
        await self.session.flush()

        return token_value

    async def get_user_by_email(self, email: str) -> Optional[Usuario]:
        """Get user by email address.
        
        Args:
            email: User email to search for
            
        Returns:
            Usuario object if found, None otherwise
        """
        result = await self.session.execute(
            select(Usuario).where(Usuario.email == email)
        )
        return result.scalars().first()

    async def get_user_with_roles(self, user_id: int) -> Optional[dict]:
        """Get user data with their roles.
        
        Args:
            user_id: User ID to fetch
            
        Returns:
            Dictionary with user data and roles list
        """
        result = await self.session.execute(
            select(Usuario).where(Usuario.id == user_id)
        )
        user = result.scalars().first()

        if not user:
            return None

        # Get user roles
        roles_result = await self.session.execute(
            select(Rol).join(UsuarioRol).where(UsuarioRol.usuario_id == user_id)
        )
        roles = roles_result.scalars().all()
        role_names = [role.nombre for role in roles]

        return {
            "user": user,
            "roles": role_names,
        }

    async def register(self, request: RegisterRequest) -> TokenResponse:
        """Register a new user.
        
        Creates a new user with CLIENT role and returns tokens.
        
        Args:
            request: RegisterRequest with user data
            
        Returns:
            TokenResponse with access token, refresh token, and user data
            
        Raises:
            ValueError: If email already registered
        """
        # Check if email already exists
        existing_user = await self.get_user_by_email(request.email)
        if existing_user:
            raise ValueError("El email ya está registrado")

        # Create new user
        hashed_password = self.hash_password(request.password)
        
        new_user = Usuario(
            email=request.email,
            nombre=request.nombre,
            apellido="",  # Not provided in registration, can be updated later
            hashed_password=hashed_password,
            numero_telefono=request.numero_telefono,
            activo=True,
            verificado=False,
        )

        self.session.add(new_user)
        await self.session.flush()  # Get the ID without committing

        # Get CLIENT role (customer role with ID 2 based on seed data)
        # For now we'll search by name since we don't know the ID yet
        roles_result = await self.session.execute(
            select(Rol).where(Rol.nombre == "customer")
        )
        customer_role = roles_result.scalars().first()

        if not customer_role:
            # If customer role doesn't exist, create it
            customer_role = Rol(
                nombre="customer",
                descripcion="Regular customer",
            )
            self.session.add(customer_role)
            await self.session.flush()

        # Assign CLIENT role to user
        usuario_rol = UsuarioRol(
            usuario_id=new_user.id,
            rol_id=customer_role.id,
        )
        self.session.add(usuario_rol)
        await self.session.flush()

        # Create tokens
        access_token = self.create_access_token(
            user_id=new_user.id,
            email=new_user.email,
            roles=["customer"],
        )

        refresh_token = await self.create_refresh_token(user_id=new_user.id)

        # Build user response
        user_response = UserResponse(
            id=new_user.id,
            nombre=new_user.nombre,
            email=new_user.email,
            numero_telefono=new_user.numero_telefono,
            roles=["customer"],
            creado_en=new_user.created_at,
            actualizado_en=new_user.updated_at,
        )

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="Bearer",
            user=user_response,
        )

    def decode_token(self, token: str) -> Optional[TokenPayload]:
        """Decode and validate a JWT token.
        
        Args:
            token: JWT token string
            
        Returns:
            TokenPayload if valid, None if invalid or expired
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
