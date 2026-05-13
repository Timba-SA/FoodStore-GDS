"""SQLModel base and common utilities."""

from datetime import datetime
from typing import Optional

from sqlmodel import SQLModel, Field


def _utcnow() -> datetime:
    """Return current UTC time as a timezone-NAIVE datetime.

    The DB columns are declared as TIMESTAMP WITHOUT TIME ZONE (asyncpg default).
    PostgreSQL / asyncpg rejects timezone-aware datetimes for those columns.
    We store naive UTC and handle timezone awareness in the service layer when
    needed for comparisons.
    """
    return datetime.utcnow()  # noqa: DTZ003 — intentionally naive for DB compat



class TimestampMixin:
    """Mixin that adds created_at / updated_at / deleted_at to any model.

    NOTE: We intentionally do NOT use sa_column=Column(DateTime(timezone=True))
    here because Column instances cannot be shared across multiple table classes
    that inherit the same mixin — SQLAlchemy raises:
        ArgumentError: Column object 'created_at' already assigned to Table '...'

    Instead we keep nullable/default in Field() and rely on PostgreSQL storing
    datetimes as TIMESTAMP WITHOUT TIME ZONE.  The application layer must use
    naive UTC datetimes (datetime.utcnow() style) or strip timezone info before
    persisting.  All comparisons in service layer use timezone-naive arithmetic.
    """

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
