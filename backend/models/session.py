"""Workout session and exercise log models."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from sqlalchemy import (
    CheckConstraint,
    DateTime,
)
from sqlalchemy import Enum as SQLEnum
from sqlalchemy import (
    ForeignKey,
    Integer,
    Numeric,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func, text

from models.base import Base
from models.enums import SessionType


class WorkoutSession(Base):
    __tablename__ = "workout_sessions"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    workout_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("workouts.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    plan_id: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("workout_plans.id", ondelete="SET NULL"),
        index=True,
    )
    session_type: Mapped[SessionType] = mapped_column(
        SQLEnum(SessionType, name="session_type", create_type=False),
        nullable=False,
        default=SessionType.ASSIGNED,
        server_default=SessionType.ASSIGNED.value,
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    user: Mapped["User"] = relationship(back_populates="workout_sessions")
    workout: Mapped["Workout"] = relationship(back_populates="sessions")
    plan: Mapped[Optional["WorkoutPlan"]] = relationship(back_populates="sessions")
    logs: Mapped[list["ExerciseLog"]] = relationship(
        back_populates="session", cascade="all, delete-orphan"
    )


class ExerciseLog(Base):
    __tablename__ = "exercise_logs"
    __table_args__ = (
        CheckConstraint('"sets" IS NULL OR "sets" >= 0', name="ck_exercise_logs_sets_non_negative"),
        CheckConstraint("reps IS NULL OR reps >= 0", name="ck_exercise_logs_reps_non_negative"),
        CheckConstraint(
            "weight IS NULL OR weight >= 0", name="ck_exercise_logs_weight_non_negative"
        ),
        CheckConstraint(
            "duration IS NULL OR duration >= 0",
            name="ck_exercise_logs_duration_non_negative",
        ),
    )

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    session_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("workout_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    sets: Mapped[Optional[int]] = mapped_column(Integer)
    reps: Mapped[Optional[int]] = mapped_column(Integer)
    weight: Mapped[Optional[Decimal]] = mapped_column(Numeric(8, 2))
    duration: Mapped[Optional[int]] = mapped_column(Integer)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    logged_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    session: Mapped[WorkoutSession] = relationship(back_populates="logs")
