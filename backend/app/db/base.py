"""SQLModel base and common utilities."""

from datetime import datetime, timezone
from typing import Optional

from sqlmodel import SQLModel, Field


def _utcnow() -> datetime:
    """Return current UTC time as timezone-aware datetime.

    Using datetime.now(timezone.utc) instead of the deprecated datetime.utcnow()
    (deprecated in Python 3.12).  This ensures all timestamps stored in the DB
    are comparable without .replace(tzinfo=...) patches elsewhere.
    """
    return datetime.now(timezone.utc)


class TimestampMixin:
    """Mixin that adds created_at / updated_at / deleted_at to any model."""

    created_at: datetime = Field(
        default_factory=_utcnow,
        nullable=False,
    )
    updated_at: datetime = Field(
        default_factory=_utcnow,
        nullable=False,
    )
    deleted_at: Optional[datetime] = Field(
        default=None,
        nullable=True,
    )


class BaseModel(SQLModel, TimestampMixin):
    """Base model with timestamps for all domain tables."""

    pass
