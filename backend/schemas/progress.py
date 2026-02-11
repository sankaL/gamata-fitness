"""Pydantic schemas for user progress and analytics endpoints."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator

from models.enums import SessionType, WorkoutType


class UserSessionHistoryQuery(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=10, ge=1, le=100)
    start_date: date | None = None
    end_date: date | None = None
    workout_type: WorkoutType | None = None
    muscle_group_id: UUID | None = None

    @model_validator(mode="after")
    def validate_date_range(self) -> "UserSessionHistoryQuery":
        if self.start_date and self.end_date and self.start_date > self.end_date:
            raise ValueError("start_date must be on or before end_date.")
        return self


class SessionHistoryLogResponse(BaseModel):
    id: UUID
    sets: int | None = None
    reps: int | None = None
    weight: Decimal | None = None
    duration: int | None = None
    notes: str | None = None
    logged_at: datetime
    updated_at: datetime


class SessionHistoryItemResponse(BaseModel):
    id: UUID
    workout_id: UUID
    workout_name: str
    workout_type: WorkoutType
    session_type: SessionType
    plan_id: UUID | None = None
    completed_at: datetime | None = None
    updated_at: datetime
    muscle_groups: list[str]
    total_logs: int
    total_sets: int
    total_reps: int
    total_duration: int
    total_volume: float
    max_weight: Decimal | None = None
    logs: list[SessionHistoryLogResponse]


class PaginatedUserSessionsResponse(BaseModel):
    items: list[SessionHistoryItemResponse]
    page: int
    page_size: int
    total: int
    total_pages: int


class ProgressDateRangeQuery(BaseModel):
    start_date: date | None = None
    end_date: date | None = None

    @model_validator(mode="after")
    def validate_date_range(self) -> "ProgressDateRangeQuery":
        if self.start_date and self.end_date and self.start_date > self.end_date:
            raise ValueError("start_date must be on or before end_date.")
        return self


class MuscleGroupProgressItemResponse(BaseModel):
    muscle_group_id: UUID
    muscle_group_name: str
    total_volume: float
    total_duration: int
    total_sessions: int


class MuscleGroupProgressResponse(BaseModel):
    start_date: date
    end_date: date
    items: list[MuscleGroupProgressItemResponse]


class FrequencyProgressQuery(ProgressDateRangeQuery):
    period: str = Field(default="weekly")

    @field_validator("period")
    @classmethod
    def validate_period(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in {"weekly", "monthly"}:
            raise ValueError("period must be either 'weekly' or 'monthly'.")
        return normalized


class FrequencyBucketResponse(BaseModel):
    label: str
    start_date: date
    end_date: date
    session_count: int


class FrequencyProgressResponse(BaseModel):
    period: str
    start_date: date
    end_date: date
    total_sessions: int
    buckets: list[FrequencyBucketResponse]
