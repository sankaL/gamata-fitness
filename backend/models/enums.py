"""Database enum definitions."""

from __future__ import annotations

from enum import Enum
from typing import TypeVar

EnumType = TypeVar("EnumType", bound=Enum)


def enum_values(enum_cls: type[EnumType]) -> list[str]:
    """Return persisted values for SQLAlchemy enum columns."""

    return [str(member.value) for member in enum_cls]


class UserRole(str, Enum):
    ADMIN = "admin"
    COACH = "coach"
    USER = "user"


class WorkoutType(str, Enum):
    STRENGTH = "strength"
    CARDIO = "cardio"


class PlanAssignmentStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    INACTIVE = "inactive"


class SessionType(str, Enum):
    ASSIGNED = "assigned"
    SWAP = "swap"
    ADHOC = "adhoc"
