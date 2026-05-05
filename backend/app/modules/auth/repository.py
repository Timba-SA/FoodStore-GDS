"""RefreshToken repository for database access."""

from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.sql import func

from app.db.repository import BaseRepository
from app.db.models.usuario import RefreshToken


class RefreshTokenRepository(BaseRepository[RefreshToken]):
    """Repository for RefreshToken operations."""

    def __init__(self, session: AsyncSession):
        """Initialize repository."""
        super().__init__(session, RefreshToken)

    async def get_by_token_hash(self, token_hash: str) -> Optional[RefreshToken]:
        """Get refresh token by token hash.
        
        Args:
            token_hash: SHA-256 hashed token
            
        Returns:
            RefreshToken or None
        """
        result = await self.session.execute(
            select(self.model_class).where(self.model_class.token_hash == token_hash)
        )
        return result.scalars().first()

    async def get_by_family_id(self, family_id: str) -> list[RefreshToken]:
        """Get all refresh tokens for a family.
        
        Args:
            family_id: UUID v4 string
            
        Returns:
            List of RefreshToken
        """
        result = await self.session.execute(
            select(self.model_class).where(self.model_class.family_id == family_id)
        )
        return result.scalars().all()

    async def revoke_family(self, family_id: str) -> int:
        """Revoke all tokens in a family (set revoked_at = now).
        
        Args:
            family_id: UUID v4 string
            
        Returns:
            Number of tokens revoked
        """
        stmt = (
            update(self.model_class)
            .where(self.model_class.family_id == family_id)
            .values(revoked_at=func.now())
        )
        result = await self.session.execute(stmt)
        await self.session.flush()
        return result.rowcount

    async def mark_used(self, token_id: int) -> Optional[RefreshToken]:
        """Mark token as used (set last_used_at = now).
        
        Args:
            token_id: Refresh token ID
            
        Returns:
            Updated RefreshToken or None
        """
        stmt = (
            update(self.model_class)
            .where(self.model_class.id == token_id)
            .values(last_used_at=func.now())
        )
        await self.session.execute(stmt)
        await self.session.flush()
        return await self.get_by_id(token_id)

    async def rotate_token(self, old_token_id: int, new_token: RefreshToken) -> RefreshToken:
        """Rotate token: set replaced_by_id on old token and persist new token.
        
        Args:
            old_token_id: ID of token being replaced
            new_token: New RefreshToken instance
            
        Returns:
            The new token persisted
        """
        # Update old token to point to new token
        stmt = (
            update(self.model_class)
            .where(self.model_class.id == old_token_id)
            .values(replaced_by_id=new_token.id)
        )
        await self.session.execute(stmt)
        # Persist new token
        self.session.add(new_token)
        await self.session.flush()
        return new_token