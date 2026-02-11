"""Pydantic schemas for user dashboard endpoints."""

from __future__ import annotations

from datetime import date
from uuid import UUID

from pydantic import BaseModel

from models.enums import WorkoutType


class DashboardMuscleGroupResponse(BaseModel):
    id: UUID
    name: str
    icon: str


class DashboardWorkoutSummaryResponse(BaseModel):
    id: UUID
    name: str
    type: WorkoutType
    muscle_groups: list[DashboardMuscleGroupResponse]


class UserTodayWorkoutResponse(BaseModel):
    date: date
    day_of_week: int
    plan_id: UUID | None = None
    plan_name: str | None = None
    workouts: list[DashboardWorkoutSummaryResponse]
    completed_sessions_today: int


class UserWeekPlanDayResponse(BaseModel):
    date: date
    day_of_week: int
    workouts: list[DashboardWorkoutSummaryResponse]


class UserWeekPlanResponse(BaseModel):
    week_start: date
    week_end: date
    plan_id: UUID | None = None
    plan_name: str | None = None
    days: list[UserWeekPlanDayResponse]


class UserQuickStatsResponse(BaseModel):
    sessions_this_week: int
    current_streak_days: int
    completed_today: int
    total_completed_sessions: int


class UserCoachResponse(BaseModel):
    id: UUID
    name: str
    email: str


class UserCoachesResponse(BaseModel):
    coaches: list[UserCoachResponse]
