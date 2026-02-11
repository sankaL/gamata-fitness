"""Workout plan and assignment models."""

from __future__ import annotations

from datetime import date, datetime
from typing import Optional
from uuid import UUID

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
)
from sqlalchemy import Enum as SQLEnum
from sqlalchemy import (
    ForeignKey,
    SmallInteger,
    String,
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func, text

from models.base import Base, TimestampMixin
from models.enums import PlanAssignmentStatus, enum_values


class WorkoutPlan(TimestampMixin, Base):
    __tablename__ = "workout_plans"
    __table_args__ = (
        CheckConstraint("start_date <= end_date", name="ck_workout_plans_date_range"),
    )

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    name: Mapped[str] = mapped_column(String(180), nullable=False)
    coach_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    is_archived: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
        index=True,
    )
    archived_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    coach: Mapped["User"] = relationship(back_populates="workout_plans")
    days: Mapped[list["PlanDay"]] = relationship(
        back_populates="plan", cascade="all, delete-orphan"
    )
    assignments: Mapped[list["PlanAssignment"]] = relationship(
        back_populates="plan", cascade="all, delete-orphan"
    )
    sessions: Mapped[list["WorkoutSession"]] = relationship(back_populates="plan")


class PlanDay(Base):
    __tablename__ = "plan_days"
    __table_args__ = (
        CheckConstraint(
            "day_of_week >= 0 AND day_of_week <= 6", name="ck_plan_days_day_of_week"
        ),
    )

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    plan_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("workout_plans.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    day_of_week: Mapped[int] = mapped_column(SmallInteger, nullable=False)

    plan: Mapped[WorkoutPlan] = relationship(back_populates="days")
    workout_links: Mapped[list["PlanDayWorkout"]] = relationship(
        back_populates="plan_day", cascade="all, delete-orphan"
    )
    workouts: Mapped[list["Workout"]] = relationship(
        secondary="plan_day_workouts",
        back_populates="plan_days",
        overlaps="workout_links,plan_day_links",
    )


class PlanDayWorkout(Base):
    __tablename__ = "plan_day_workouts"

    plan_day_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("plan_days.id", ondelete="CASCADE"),
        primary_key=True,
    )
    workout_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("workouts.id", ondelete="RESTRICT"),
        primary_key=True,
    )

    plan_day: Mapped[PlanDay] = relationship(back_populates="workout_links")
    workout: Mapped["Workout"] = relationship(back_populates="plan_day_links")


class PlanAssignment(Base):
    __tablename__ = "plan_assignments"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    plan_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("workout_plans.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status: Mapped[PlanAssignmentStatus] = mapped_column(
        SQLEnum(
            PlanAssignmentStatus,
            name="plan_assignment_status",
            create_type=False,
            values_callable=enum_values,
        ),
        nullable=False,
        default=PlanAssignmentStatus.PENDING,
        server_default=PlanAssignmentStatus.PENDING.value,
        index=True,
    )
    assigned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    activated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    deactivated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    plan: Mapped[WorkoutPlan] = relationship(back_populates="assignments")
    user: Mapped["User"] = relationship(back_populates="assigned_plans")
