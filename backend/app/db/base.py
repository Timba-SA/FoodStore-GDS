"""SQLModel base and common utilities"""

from datetime import datetime
from typing import Optional

from sqlmodel import SQLModel, Field


class TimestampMixin:
    """Mixin for timestamp fields (created_at, updated_at, deleted_at)."""

    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
        description="Record creation timestamp",
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
        description="Record last update timestamp",
    )
    deleted_at: Optional[datetime] = Field(
        default=None,
        nullable=True,
        description="Record soft delete timestamp",
    )


class BaseModel(SQLModel, TimestampMixin):
    """Base model with common fields and timestamp tracking."""

    pass
