"""Database enum definitions."""

from __future__ import annotations

from enum import Enum


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
