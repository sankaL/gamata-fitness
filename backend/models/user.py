"""User and coach assignment models."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import (
    CheckConstraint,
    DateTime,
)
from sqlalchemy import Enum as SQLEnum
from sqlalchemy import (
    ForeignKey,
    String,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func, text

from models.base import Base, TimestampMixin
from models.enums import UserRole


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(320), nullable=False, unique=True)
    role: Mapped[UserRole] = mapped_column(
        SQLEnum(UserRole, name="user_role", create_type=False),
        nullable=False,
        default=UserRole.USER,
        server_default=UserRole.USER.value,
    )

    coach_assignments: Mapped[list["CoachUserAssignment"]] = relationship(
        back_populates="coach",
        foreign_keys="CoachUserAssignment.coach_id",
        cascade="all, delete-orphan",
    )
    user_assignments: Mapped[list["CoachUserAssignment"]] = relationship(
        back_populates="user",
        foreign_keys="CoachUserAssignment.user_id",
        cascade="all, delete-orphan",
    )
    assignments_created: Mapped[list["CoachUserAssignment"]] = relationship(
        back_populates="assigned_by_user",
        foreign_keys="CoachUserAssignment.assigned_by",
    )

    workout_plans: Mapped[list["WorkoutPlan"]] = relationship(back_populates="coach")
    assigned_plans: Mapped[list["PlanAssignment"]] = relationship(back_populates="user")
    workout_sessions: Mapped[list["WorkoutSession"]] = relationship(
        back_populates="user"
    )


class CoachUserAssignment(Base):
    __tablename__ = "coach_user_assignments"
    __table_args__ = (
        UniqueConstraint(
            "coach_id", "user_id", name="uq_coach_user_assignments_coach_user"
        ),
        CheckConstraint(
            "coach_id <> user_id", name="ck_coach_user_assignments_distinct"
        ),
    )

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    coach_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    assigned_by: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    assigned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    coach: Mapped[User] = relationship(
        back_populates="coach_assignments", foreign_keys=[coach_id]
    )
    user: Mapped[User] = relationship(
        back_populates="user_assignments", foreign_keys=[user_id]
    )
    assigned_by_user: Mapped[User] = relationship(
        back_populates="assignments_created", foreign_keys=[assigned_by]
    )
