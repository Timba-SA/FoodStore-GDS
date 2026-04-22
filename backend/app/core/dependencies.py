"""Application dependencies for dependency injection"""

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db_session


async def get_db() -> AsyncSession:
    """Get database session dependency.

    Yields:
        AsyncSession: Database session
    """
    async for session in get_db_session():
        yield session
