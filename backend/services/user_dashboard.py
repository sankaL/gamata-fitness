"""Service logic for user dashboard endpoints."""

from __future__ import annotations

from datetime import date, datetime, time, timedelta, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from models.enums import PlanAssignmentStatus
from models.plan import PlanAssignment, PlanDay, WorkoutPlan
from models.session import WorkoutSession
from models.user import CoachUserAssignment, User
from models.workout import Workout
from schemas.dashboard import (
    DashboardMuscleGroupResponse,
    DashboardWorkoutSummaryResponse,
    UserCoachResponse,
    UserCoachesResponse,
    UserQuickStatsResponse,
    UserTodayWorkoutResponse,
    UserWeekPlanDayResponse,
    UserWeekPlanResponse,
)


class UserDashboardServiceError(Exception):
    """Raised when user dashboard service flows fail with client-safe messages."""

    def __init__(self, detail: str, status_code: int) -> None:
        super().__init__(detail)
        self.detail = detail
        self.status_code = status_code


def _workout_summary(workout: Workout) -> DashboardWorkoutSummaryResponse:
    groups = sorted(workout.muscle_groups, key=lambda group: group.name.lower())
    return DashboardWorkoutSummaryResponse(
        id=workout.id,
        name=workout.name,
        type=workout.type,
        muscle_groups=[
            DashboardMuscleGroupResponse(id=group.id, name=group.name, icon=group.icon)
            for group in groups
        ],
    )


def _today_window(now: datetime | None = None) -> tuple[datetime, datetime]:
    current = now or datetime.now(timezone.utc)
    start = datetime.combine(current.date(), time.min, tzinfo=timezone.utc)
    end = start + timedelta(days=1)
    return start, end


def _week_window(today: date | None = None) -> tuple[date, date]:
    current_date = today or datetime.now(timezone.utc).date()
    week_start = current_date - timedelta(days=current_date.weekday())
    week_end = week_start + timedelta(days=6)
    return week_start, week_end


def _load_active_assignment(db: Session, user_id: UUID) -> PlanAssignment | None:
    return db.scalar(
        select(PlanAssignment)
        .join(WorkoutPlan, WorkoutPlan.id == PlanAssignment.plan_id)
        .where(
            PlanAssignment.user_id == user_id,
            PlanAssignment.status == PlanAssignmentStatus.ACTIVE,
            WorkoutPlan.is_archived.is_(False),
        )
        .options(
            selectinload(PlanAssignment.plan)
            .selectinload(WorkoutPlan.days)
            .selectinload(PlanDay.workouts)
            .selectinload(Workout.muscle_groups)
        )
        .order_by(PlanAssignment.activated_at.desc(), PlanAssignment.assigned_at.desc())
    )


def get_user_today_workout(db: Session, *, user_id: UUID) -> UserTodayWorkoutResponse:
    assignment = _load_active_assignment(db, user_id)
    today = datetime.now(timezone.utc).date()
    day_of_week = today.weekday()

    workouts: list[DashboardWorkoutSummaryResponse] = []
    plan_id = None
    plan_name = None

    if assignment and assignment.plan:
        plan_id = assignment.plan.id
        plan_name = assignment.plan.name
        today_day = next((day for day in assignment.plan.days if day.day_of_week == day_of_week), None)
        if today_day:
            ordered_workouts = sorted(today_day.workouts, key=lambda workout: workout.name.lower())
            workouts = [_workout_summary(workout) for workout in ordered_workouts]

    today_start, today_end = _today_window()
    completed_today = db.scalar(
        select(func.count(WorkoutSession.id)).where(
            WorkoutSession.user_id == user_id,
            WorkoutSession.completed_at.is_not(None),
            WorkoutSession.completed_at >= today_start,
            WorkoutSession.completed_at < today_end,
        )
    )

    return UserTodayWorkoutResponse(
        date=today,
        day_of_week=day_of_week,
        plan_id=plan_id,
        plan_name=plan_name,
        workouts=workouts,
        completed_sessions_today=int(completed_today or 0),
    )


def get_user_current_week_plan(db: Session, *, user_id: UUID) -> UserWeekPlanResponse:
    assignment = _load_active_assignment(db, user_id)
    week_start, week_end = _week_window()

    day_workout_map: dict[int, list[DashboardWorkoutSummaryResponse]] = {}
    plan_id = None
    plan_name = None

    if assignment and assignment.plan:
        plan_id = assignment.plan.id
        plan_name = assignment.plan.name
        for day in assignment.plan.days:
            ordered_workouts = sorted(day.workouts, key=lambda workout: workout.name.lower())
            day_workout_map[day.day_of_week] = [_workout_summary(workout) for workout in ordered_workouts]

    days = [
        UserWeekPlanDayResponse(
            date=week_start + timedelta(days=offset),
            day_of_week=offset,
            workouts=day_workout_map.get(offset, []),
        )
        for offset in range(7)
    ]

    return UserWeekPlanResponse(
        week_start=week_start,
        week_end=week_end,
        plan_id=plan_id,
        plan_name=plan_name,
        days=days,
    )


def get_user_quick_stats(db: Session, *, user_id: UUID) -> UserQuickStatsResponse:
    now = datetime.now(timezone.utc)
    current_date = now.date()

    week_start_date, _ = _week_window(current_date)
    week_start = datetime.combine(week_start_date, time.min, tzinfo=timezone.utc)
    week_end = week_start + timedelta(days=7)

    today_start, today_end = _today_window(now)

    sessions_this_week = db.scalar(
        select(func.count(WorkoutSession.id)).where(
            WorkoutSession.user_id == user_id,
            WorkoutSession.completed_at.is_not(None),
            WorkoutSession.completed_at >= week_start,
            WorkoutSession.completed_at < week_end,
        )
    )
    completed_today = db.scalar(
        select(func.count(WorkoutSession.id)).where(
            WorkoutSession.user_id == user_id,
            WorkoutSession.completed_at.is_not(None),
            WorkoutSession.completed_at >= today_start,
            WorkoutSession.completed_at < today_end,
        )
    )
    total_completed = db.scalar(
        select(func.count(WorkoutSession.id)).where(
            WorkoutSession.user_id == user_id,
            WorkoutSession.completed_at.is_not(None),
        )
    )

    completed_datetimes = db.scalars(
        select(WorkoutSession.completed_at).where(
            WorkoutSession.user_id == user_id,
            WorkoutSession.completed_at.is_not(None),
        )
    ).all()
    completed_dates = {completed.date() for completed in completed_datetimes if completed}

    streak = 0
    streak_date = current_date
    while streak_date in completed_dates:
        streak += 1
        streak_date -= timedelta(days=1)

    return UserQuickStatsResponse(
        sessions_this_week=int(sessions_this_week or 0),
        current_streak_days=streak,
        completed_today=int(completed_today or 0),
        total_completed_sessions=int(total_completed or 0),
    )


def get_user_coaches(db: Session, *, user_id: UUID) -> UserCoachesResponse:
    coaches = (
        db.scalars(
            select(User)
            .join(CoachUserAssignment, CoachUserAssignment.coach_id == User.id)
            .where(CoachUserAssignment.user_id == user_id)
            .order_by(User.name.asc())
        )
        .unique()
        .all()
    )
    return UserCoachesResponse(
        coaches=[UserCoachResponse(id=coach.id, name=coach.name, email=coach.email) for coach in coaches]
    )
