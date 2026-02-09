"""Workout library models."""

from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy import Boolean, DateTime
from sqlalchemy import Enum as SQLEnum
from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func, text

from models.base import Base, TimestampMixin
from models.enums import WorkoutType


class MuscleGroup(Base):
    __tablename__ = "muscle_groups"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False, unique=True)
    icon: Mapped[str] = mapped_column(String(120), nullable=False)
    is_default: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    workout_links: Mapped[list["WorkoutMuscleGroup"]] = relationship(
        back_populates="muscle_group", cascade="all, delete-orphan"
    )
    workouts: Mapped[list["Workout"]] = relationship(
        secondary="workout_muscle_groups",
        back_populates="muscle_groups",
        overlaps="workout_links,muscle_group_links",
    )


class CardioType(Base):
    __tablename__ = "cardio_types"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False, unique=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)

    workouts: Mapped[list["Workout"]] = relationship(back_populates="cardio_type")


class Workout(TimestampMixin, Base):
    __tablename__ = "workouts"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    name: Mapped[str] = mapped_column(String(160), nullable=False, unique=True)
    description: Mapped[Optional[str]] = mapped_column(Text)
    instructions: Mapped[Optional[str]] = mapped_column(Text)
    type: Mapped[WorkoutType] = mapped_column(
        SQLEnum(WorkoutType, name="workout_type", create_type=False), nullable=False
    )
    cardio_type_id: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("cardio_types.id", ondelete="SET NULL")
    )
    is_archived: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )

    cardio_type: Mapped[Optional[CardioType]] = relationship(back_populates="workouts")
    muscle_group_links: Mapped[list["WorkoutMuscleGroup"]] = relationship(
        back_populates="workout", cascade="all, delete-orphan"
    )
    muscle_groups: Mapped[list[MuscleGroup]] = relationship(
        secondary="workout_muscle_groups",
        back_populates="workouts",
        overlaps="workout_links,muscle_group_links",
    )

    plan_days: Mapped[list["PlanDay"]] = relationship(
        secondary="plan_day_workouts",
        back_populates="workouts",
        overlaps="plan_day_links,workout_links",
    )
    plan_day_links: Mapped[list["PlanDayWorkout"]] = relationship(back_populates="workout")
    sessions: Mapped[list["WorkoutSession"]] = relationship(back_populates="workout")


class WorkoutMuscleGroup(Base):
    __tablename__ = "workout_muscle_groups"

    workout_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("workouts.id", ondelete="CASCADE"),
        primary_key=True,
    )
    muscle_group_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("muscle_groups.id", ondelete="CASCADE"),
        primary_key=True,
    )

    workout: Mapped[Workout] = relationship(back_populates="muscle_group_links")
    muscle_group: Mapped[MuscleGroup] = relationship(back_populates="workout_links")
