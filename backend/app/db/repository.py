"""Base repository pattern for database access."""

from typing import TypeVar, Generic, Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

T = TypeVar("T")


class BaseRepository(Generic[T]):
    """Generic base repository for CRUD operations."""

    def __init__(self, session: AsyncSession, model_class: type[T]):
        """Initialize repository.
        
        Args:
            session: Database session
            model_class: SQLModel class to operate on
        """
        self.session = session
        self.model_class = model_class

    async def get_by_id(self, id: int) -> Optional[T]:
        """Get record by ID.
        
        Args:
            id: Primary key value
            
        Returns:
            Model instance or None
        """
        result = await self.session.execute(
            select(self.model_class).where(self.model_class.id == id)
        )
        return result.scalars().first()

    async def get_all(self, skip: int = 0, limit: int = 100) -> List[T]:
        """Get all records with pagination.
        
        Args:
            skip: Number of records to skip
            limit: Maximum records to return
            
        Returns:
            List of model instances
        """
        result = await self.session.execute(
            select(self.model_class).offset(skip).limit(limit)
        )
        return result.scalars().all()

    async def create(self, obj: T) -> T:
        """Create a new record.
        
        Args:
            obj: Model instance to create
            
        Returns:
            Created model instance with ID
        """
        self.session.add(obj)
        await self.session.flush()
        return obj

    async def update(self, id: int, data: dict) -> Optional[T]:
        """Update a record.
        
        Args:
            id: Primary key of record to update
            data: Dictionary of fields to update
            
        Returns:
            Updated model instance or None
        """
        obj = await self.get_by_id(id)
        if not obj:
            return None

        for key, value in data.items():
            setattr(obj, key, value)

        await self.session.flush()
        return obj

    async def delete(self, id: int) -> bool:
        """Delete a record.
        
        Args:
            id: Primary key of record to delete
            
        Returns:
            True if deleted, False if not found
        """
        obj = await self.get_by_id(id)
        if not obj:
            return False

        await self.session.delete(obj)
        await self.session.flush()
        return True
