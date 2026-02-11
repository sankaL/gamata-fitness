"""Pydantic schemas for workout session endpoints."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator

from models.enums import SessionType, WorkoutType


class SessionLogInput(BaseModel):
    id: UUID | None = None
    sets: int | None = Field(default=None, ge=0, le=1000)
    reps: int | None = Field(default=None, ge=0, le=2000)
    weight: Decimal | None = Field(default=None, ge=0, max_digits=8, decimal_places=2)
    duration: int | None = Field(default=None, ge=0, le=86400)
    notes: str | None = None

    @field_validator("notes")
    @classmethod
    def normalize_notes(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None

    @model_validator(mode="after")
    def validate_payload(self) -> "SessionLogInput":
        if all(
            value is None
            for value in (self.sets, self.reps, self.weight, self.duration, self.notes)
        ):
            raise ValueError("At least one log field must be provided.")
        return self


class SessionLogCreateRequest(BaseModel):
    sets: int | None = Field(default=None, ge=0, le=1000)
    reps: int | None = Field(default=None, ge=0, le=2000)
    weight: Decimal | None = Field(default=None, ge=0, max_digits=8, decimal_places=2)
    duration: int | None = Field(default=None, ge=0, le=86400)
    notes: str | None = None

    @field_validator("notes")
    @classmethod
    def normalize_notes(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None

    @model_validator(mode="after")
    def validate_payload(self) -> "SessionLogCreateRequest":
        if all(
            value is None
            for value in (self.sets, self.reps, self.weight, self.duration, self.notes)
        ):
            raise ValueError("At least one log field must be provided.")
        return self


class SessionLogUpdateRequest(BaseModel):
    sets: int | None = Field(default=None, ge=0, le=1000)
    reps: int | None = Field(default=None, ge=0, le=2000)
    weight: Decimal | None = Field(default=None, ge=0, max_digits=8, decimal_places=2)
    duration: int | None = Field(default=None, ge=0, le=86400)
    notes: str | None = None

    @field_validator("notes")
    @classmethod
    def normalize_notes(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None

    @model_validator(mode="after")
    def validate_payload(self) -> "SessionLogUpdateRequest":
        if all(
            value is None
            for value in (self.sets, self.reps, self.weight, self.duration, self.notes)
        ):
            raise ValueError("At least one field must be provided for log update.")
        return self


class SessionCreateRequest(BaseModel):
    workout_id: UUID
    plan_id: UUID | None = None
    session_type: SessionType = SessionType.ASSIGNED

    @model_validator(mode="after")
    def validate_type_plan_relationship(self) -> "SessionCreateRequest":
        if self.session_type == SessionType.ADHOC and self.plan_id is not None:
            raise ValueError("Ad hoc sessions cannot include a plan_id.")
        if self.session_type in (SessionType.ASSIGNED, SessionType.SWAP) and self.plan_id is None:
            raise ValueError("Assigned and swap sessions require a plan_id.")
        return self


class SessionUpdateRequest(BaseModel):
    logs: list[SessionLogInput]


class SessionLogResponse(BaseModel):
    id: UUID
    sets: int | None = None
    reps: int | None = None
    weight: Decimal | None = None
    duration: int | None = None
    notes: str | None = None
    logged_at: datetime
    updated_at: datetime


class SessionWorkoutMuscleGroupResponse(BaseModel):
    id: UUID
    name: str
    icon: str


class SessionWorkoutSummaryResponse(BaseModel):
    id: UUID
    name: str
    type: WorkoutType
    target_sets: int | None = None
    target_reps: int | None = None
    suggested_weight: Decimal | None = None
    target_duration: int | None = None
    muscle_groups: list[SessionWorkoutMuscleGroupResponse]


class SessionResponse(BaseModel):
    id: UUID
    user_id: UUID
    workout_id: UUID
    plan_id: UUID | None = None
    session_type: SessionType
    completed_at: datetime | None = None
    updated_at: datetime
    workout: SessionWorkoutSummaryResponse
    logs: list[SessionLogResponse]
