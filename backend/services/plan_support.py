"""Shared helpers for plan service workflows."""

from __future__ import annotations

from datetime import datetime, time, timedelta, timezone
from uuid import UUID, uuid4

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from models.enums import SessionType
from models.plan import PlanDay, WorkoutPlan
from models.session import WorkoutSession
from models.workout import Workout
from schemas.plans import (
    PlanDayInput,
    PlanDayResponse,
    PlanDetailResponse,
    PlanWorkoutSummaryResponse,
)


class PlanServiceError(Exception):
    """Raised when plan service flows fail with client-safe messages."""

    def __init__(self, detail: str, status_code: int) -> None:
        super().__init__(detail)
        self.detail = detail
        self.status_code = status_code


def with_plan_relations() -> tuple:
    return (
        selectinload(WorkoutPlan.days).selectinload(PlanDay.workouts),
        selectinload(WorkoutPlan.assignments),
    )


def to_plan_day_response(day: PlanDay) -> PlanDayResponse:
    workouts = sorted(day.workouts, key=lambda workout: workout.name.lower())
    return PlanDayResponse(
        day_of_week=day.day_of_week,
        workouts=[PlanWorkoutSummaryResponse.model_validate(workout) for workout in workouts],
    )


def to_plan_detail_response(plan: WorkoutPlan) -> PlanDetailResponse:
    ordered_days = sorted(plan.days, key=lambda day: day.day_of_week)
    return PlanDetailResponse(
        id=plan.id,
        name=plan.name,
        coach_id=plan.coach_id,
        start_date=plan.start_date,
        end_date=plan.end_date,
        is_archived=plan.is_archived,
        archived_at=plan.archived_at,
        created_at=plan.created_at,
        updated_at=plan.updated_at,
        days=[to_plan_day_response(day) for day in ordered_days],
    )


def plan_workout_count(plan: WorkoutPlan) -> int:
    return sum(len(day.workouts) for day in plan.days)


def get_workouts_by_id(db: Session, workout_ids: list[UUID]) -> dict[UUID, Workout]:
    deduped_ids = list(dict.fromkeys(workout_ids))
    workouts = db.scalars(select(Workout).where(Workout.id.in_(deduped_ids))).all()
    workout_map = {workout.id: workout for workout in workouts}

    missing = [workout_id for workout_id in deduped_ids if workout_id not in workout_map]
    if missing:
        raise PlanServiceError("One or more selected workouts were not found.", 404)

    archived = [workout.name for workout in workouts if workout.is_archived]
    if archived:
        raise PlanServiceError("Archived workouts cannot be assigned to plans.", 400)

    return workout_map


def apply_plan_days(db: Session, plan: WorkoutPlan, day_payloads: list[PlanDayInput]) -> None:
    workout_ids = [workout_id for day in day_payloads for workout_id in day.workout_ids]
    workout_map = get_workouts_by_id(db, workout_ids)

    plan.days.clear()
    db.flush()

    for day_payload in sorted(day_payloads, key=lambda item: item.day_of_week):
        plan_day = PlanDay(id=uuid4(), day_of_week=day_payload.day_of_week)
        plan_day.workouts = [workout_map[workout_id] for workout_id in day_payload.workout_ids]
        plan.days.append(plan_day)


def week_window_utc(now: datetime | None = None) -> tuple[datetime, datetime]:
    current = now or datetime.now(timezone.utc)
    week_start_date = (current - timedelta(days=current.weekday())).date()
    start = datetime.combine(week_start_date, time.min, tzinfo=timezone.utc)
    end = start + timedelta(days=7)
    return start, end


def scheduled_workout_count(plan: WorkoutPlan) -> int:
    return sum(len(day.workouts) for day in plan.days)


def completed_scheduled_workouts_this_week(db: Session, *, user_id: UUID, plan_id: UUID) -> int:
    week_start, week_end = week_window_utc()
    count = db.scalar(
        select(func.count(WorkoutSession.id)).where(
            WorkoutSession.user_id == user_id,
            WorkoutSession.plan_id == plan_id,
            WorkoutSession.session_type == SessionType.ASSIGNED,
            WorkoutSession.completed_at.is_not(None),
            WorkoutSession.completed_at >= week_start,
            WorkoutSession.completed_at < week_end,
        )
    )
    return int(count or 0)


def completion_percent(db: Session, *, user_id: UUID, plan: WorkoutPlan) -> float:
    scheduled_count = scheduled_workout_count(plan)
    if scheduled_count == 0:
        return 0.0

    completed_count = completed_scheduled_workouts_this_week(db, user_id=user_id, plan_id=plan.id)
    completion = min(100.0, (completed_count / scheduled_count) * 100)
    return round(completion, 2)
