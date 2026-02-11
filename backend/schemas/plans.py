"""Pydantic schemas for coach plan management endpoints."""

from __future__ import annotations

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from models.enums import PlanAssignmentStatus, WorkoutType


class PlanWorkoutSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    type: WorkoutType
    is_archived: bool


class PlanDayResponse(BaseModel):
    day_of_week: int
    workouts: list[PlanWorkoutSummaryResponse]


class PlanListItemResponse(BaseModel):
    id: UUID
    name: str
    coach_id: UUID
    start_date: date
    end_date: date
    is_archived: bool
    archived_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    total_days: int
    total_workouts: int


class PlanDetailResponse(BaseModel):
    id: UUID
    name: str
    coach_id: UUID
    start_date: date
    end_date: date
    is_archived: bool
    archived_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    days: list[PlanDayResponse]


class PlanListQuery(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=10, ge=1, le=100)
    is_archived: bool | None = None
    search: str | None = Field(default=None, max_length=180)

    @field_validator("search")
    @classmethod
    def normalize_search(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None


class PaginatedPlansResponse(BaseModel):
    items: list[PlanListItemResponse]
    page: int
    page_size: int
    total: int
    total_pages: int


class PlanDayInput(BaseModel):
    day_of_week: int = Field(ge=0, le=6)
    workout_ids: list[UUID] = Field(default_factory=list)

    @field_validator("workout_ids")
    @classmethod
    def dedupe_workout_ids(cls, value: list[UUID]) -> list[UUID]:
        deduped = list(dict.fromkeys(value))
        if not deduped:
            raise ValueError("Each selected day must include at least one workout.")
        return deduped


class PlanCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=180)
    start_date: date
    end_date: date
    days: list[PlanDayInput] = Field(default_factory=list)

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Plan name is required.")
        return cleaned

    @model_validator(mode="after")
    def validate_days(self) -> "PlanCreateRequest":
        if self.start_date > self.end_date:
            raise ValueError("Plan start date must be on or before end date.")
        if not self.days:
            raise ValueError("At least one day with workouts is required.")

        day_keys = [day.day_of_week for day in self.days]
        if len(day_keys) != len(set(day_keys)):
            raise ValueError("Each day of week can appear only once.")

        total_workouts = sum(len(day.workout_ids) for day in self.days)
        if total_workouts == 0:
            raise ValueError("At least one workout must be assigned to the plan.")

        return self


class PlanUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=180)
    start_date: date | None = None
    end_date: date | None = None
    days: list[PlanDayInput] | None = None

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Plan name is required.")
        return cleaned

    @model_validator(mode="after")
    def validate_payload(self) -> "PlanUpdateRequest":
        if (
            self.name is None
            and self.start_date is None
            and self.end_date is None
            and self.days is None
        ):
            raise ValueError("At least one field must be provided for update.")

        if self.start_date and self.end_date and self.start_date > self.end_date:
            raise ValueError("Plan start date must be on or before end date.")

        if self.days is not None:
            day_keys = [day.day_of_week for day in self.days]
            if len(day_keys) != len(set(day_keys)):
                raise ValueError("Each day of week can appear only once.")
            total_workouts = sum(len(day.workout_ids) for day in self.days)
            if total_workouts == 0:
                raise ValueError("At least one workout must be assigned to the plan.")

        return self


class PlanAssignRequest(BaseModel):
    user_ids: list[UUID] = Field(default_factory=list)

    @field_validator("user_ids")
    @classmethod
    def dedupe_user_ids(cls, value: list[UUID]) -> list[UUID]:
        deduped = list(dict.fromkeys(value))
        if not deduped:
            raise ValueError("At least one user is required for assignment.")
        return deduped


class PlanAssignmentResponseItem(BaseModel):
    assignment_id: UUID
    user_id: UUID
    status: PlanAssignmentStatus
    assigned_at: datetime
    activated_at: datetime | None = None
    deactivated_at: datetime | None = None


class PlanAssignResponse(BaseModel):
    plan_id: UUID
    assignments: list[PlanAssignmentResponseItem]


class PlanUserStatusResponse(BaseModel):
    user_id: UUID
    user_name: str
    user_email: str
    status: PlanAssignmentStatus
    assigned_at: datetime
    activated_at: datetime | None = None
    deactivated_at: datetime | None = None
    weekly_completion_percent: float


class PlanUsersResponse(BaseModel):
    plan_id: UUID
    users: list[PlanUserStatusResponse]


class CoachRosterUserResponse(BaseModel):
    user_id: UUID
    user_name: str
    user_email: str
    active_plan_id: UUID | None = None
    active_plan_name: str | None = None
    active_plan_status: PlanAssignmentStatus | None = None
    pending_plan_count: int
    weekly_completion_percent: float


class CoachRosterResponse(BaseModel):
    coach_id: UUID
    users: list[CoachRosterUserResponse]
