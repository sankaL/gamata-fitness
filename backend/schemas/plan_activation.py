"""Pydantic schemas for user plan activation workflows."""

from __future__ import annotations

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel

from models.enums import PlanAssignmentStatus


class ActivePlanSummaryResponse(BaseModel):
    assignment_id: UUID
    plan_id: UUID
    plan_name: str
    activated_at: datetime | None = None


class PendingPlanAssignmentResponse(BaseModel):
    assignment_id: UUID
    plan_id: UUID
    plan_name: str
    coach_id: UUID
    coach_name: str
    start_date: date
    end_date: date
    total_days: int
    total_workouts: int
    assigned_at: datetime
    plan_is_archived: bool


class UserPendingPlansResponse(BaseModel):
    active_plan: ActivePlanSummaryResponse | None = None
    pending_assignments: list[PendingPlanAssignmentResponse]


class PlanAssignmentActionResponse(BaseModel):
    assignment_id: UUID
    plan_id: UUID
    status: PlanAssignmentStatus
    activated_at: datetime | None = None
    deactivated_at: datetime | None = None
    deactivated_assignment_ids: list[UUID]
