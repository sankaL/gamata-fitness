"""Pydantic schemas for workout library and lookup endpoints."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from models.enums import CardioDifficultyLevel, WorkoutType


class MuscleGroupResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    icon: str
    is_default: bool
    created_at: datetime


class CardioTypeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    description: str


class WorkoutResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    description: str | None = None
    instructions: str | None = None
    type: WorkoutType
    cardio_type_id: UUID | None = None
    cardio_type: CardioTypeResponse | None = None
    target_sets: int | None = None
    target_reps: int | None = None
    suggested_weight: Decimal | None = None
    target_duration: int | None = None
    difficulty_level: CardioDifficultyLevel | None = None
    is_archived: bool
    created_at: datetime
    updated_at: datetime
    muscle_groups: list[MuscleGroupResponse] = Field(default_factory=list)


class WorkoutListQuery(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=10, ge=1, le=100)
    type: WorkoutType | None = None
    muscle_group_id: UUID | None = None
    is_archived: bool | None = None
    search: str | None = Field(default=None, max_length=160)

    @field_validator("search")
    @classmethod
    def normalize_search(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None


class PaginatedWorkoutsResponse(BaseModel):
    items: list[WorkoutResponse]
    page: int
    page_size: int
    total: int
    total_pages: int


class WorkoutCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    description: str | None = None
    instructions: str | None = None
    type: WorkoutType
    cardio_type_id: UUID | None = None
    target_sets: int | None = Field(default=None, ge=1, le=100)
    target_reps: int | None = Field(default=None, ge=1, le=500)
    suggested_weight: Decimal | None = Field(
        default=None, ge=0, max_digits=8, decimal_places=2
    )
    target_duration: int | None = Field(default=None, ge=1, le=1440)
    difficulty_level: CardioDifficultyLevel | None = None
    muscle_group_ids: list[UUID] = Field(default_factory=list)

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Workout name is required.")
        return cleaned

    @field_validator("description", "instructions")
    @classmethod
    def normalize_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None

    @model_validator(mode="after")
    def validate_workout_fields(self) -> "WorkoutCreateRequest":
        if not self.muscle_group_ids:
            raise ValueError("At least one muscle group is required.")

        if self.type == WorkoutType.STRENGTH:
            if self.target_sets is None or self.target_reps is None:
                raise ValueError("Strength workouts require target sets and reps.")
            if any(
                value is not None
                for value in (
                    self.cardio_type_id,
                    self.target_duration,
                    self.difficulty_level,
                )
            ):
                raise ValueError(
                    "Cardio-only fields are not allowed for strength workouts."
                )

        if self.type == WorkoutType.CARDIO:
            if (
                self.cardio_type_id is None
                or self.target_duration is None
                or self.difficulty_level is None
            ):
                raise ValueError(
                    "Cardio workouts require cardio type, target duration, and difficulty level."
                )
            if any(
                value is not None
                for value in (self.target_sets, self.target_reps, self.suggested_weight)
            ):
                raise ValueError(
                    "Strength-only fields are not allowed for cardio workouts."
                )

        return self


class WorkoutUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=160)
    description: str | None = None
    instructions: str | None = None
    type: WorkoutType | None = None
    cardio_type_id: UUID | None = None
    target_sets: int | None = Field(default=None, ge=1, le=100)
    target_reps: int | None = Field(default=None, ge=1, le=500)
    suggested_weight: Decimal | None = Field(
        default=None, ge=0, max_digits=8, decimal_places=2
    )
    target_duration: int | None = Field(default=None, ge=1, le=1440)
    difficulty_level: CardioDifficultyLevel | None = None
    muscle_group_ids: list[UUID] | None = None

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Workout name is required.")
        return cleaned

    @field_validator("description", "instructions")
    @classmethod
    def normalize_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None

    @model_validator(mode="after")
    def ensure_payload_has_updates(self) -> "WorkoutUpdateRequest":
        if all(
            value is None
            for value in (
                self.name,
                self.description,
                self.instructions,
                self.type,
                self.cardio_type_id,
                self.target_sets,
                self.target_reps,
                self.suggested_weight,
                self.target_duration,
                self.difficulty_level,
                self.muscle_group_ids,
            )
        ):
            raise ValueError("At least one field must be provided for update.")
        return self


class WorkoutArchiveResponse(BaseModel):
    workout: WorkoutResponse
    active_plan_count: int


class MuscleGroupCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    icon: str = Field(min_length=1, max_length=120)

    @field_validator("name", "icon")
    @classmethod
    def normalize_field(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Field cannot be empty.")
        return cleaned
