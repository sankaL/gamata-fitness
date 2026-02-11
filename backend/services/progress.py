"""Service logic for user progress and history analytics."""

from __future__ import annotations

from collections import Counter
from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from models.session import WorkoutSession
from models.workout import MuscleGroup, Workout
from schemas.progress import (
    FrequencyBucketResponse,
    FrequencyProgressQuery,
    FrequencyProgressResponse,
    MuscleGroupProgressItemResponse,
    MuscleGroupProgressResponse,
    PaginatedUserSessionsResponse,
    ProgressDateRangeQuery,
    SessionHistoryItemResponse,
    SessionHistoryLogResponse,
    UserSessionHistoryQuery,
)


class ProgressServiceError(Exception):
    """Raised when progress service flows fail with client-safe messages."""

    def __init__(self, detail: str, status_code: int) -> None:
        super().__init__(detail)
        self.detail = detail
        self.status_code = status_code


def _with_history_relations() -> tuple:
    return (
        selectinload(WorkoutSession.workout).selectinload(Workout.muscle_groups),
        selectinload(WorkoutSession.logs),
    )


def _to_history_item(session: WorkoutSession) -> SessionHistoryItemResponse:
    workout = session.workout
    if workout is None:
        raise ProgressServiceError("Session workout relation is missing.", 500)

    ordered_logs = sorted(session.logs, key=lambda log: (log.logged_at, str(log.id)))

    total_sets = 0
    total_reps = 0
    total_duration = 0
    total_volume = 0.0
    max_weight: Decimal | None = None

    for log in ordered_logs:
        total_sets += int(log.sets or 0)
        total_reps += int(log.reps or 0)
        total_duration += int(log.duration or 0)

        if log.weight is not None:
            sets_value = int(log.sets or 1)
            reps_value = int(log.reps or 1)
            total_volume += float(log.weight) * sets_value * reps_value
            if max_weight is None or log.weight > max_weight:
                max_weight = log.weight
        elif log.duration is not None:
            total_volume += float(log.duration)

    muscle_groups = sorted([group.name for group in workout.muscle_groups], key=str.lower)
    return SessionHistoryItemResponse(
        id=session.id,
        workout_id=workout.id,
        workout_name=workout.name,
        workout_type=workout.type,
        session_type=session.session_type,
        plan_id=session.plan_id,
        completed_at=session.completed_at,
        updated_at=session.updated_at,
        muscle_groups=muscle_groups,
        total_logs=len(ordered_logs),
        total_sets=total_sets,
        total_reps=total_reps,
        total_duration=total_duration,
        total_volume=round(total_volume, 2),
        max_weight=max_weight,
        logs=[
            SessionHistoryLogResponse(
                id=log.id,
                sets=log.sets,
                reps=log.reps,
                weight=log.weight,
                duration=log.duration,
                notes=log.notes,
                logged_at=log.logged_at,
                updated_at=log.updated_at,
            )
            for log in ordered_logs
        ],
    )


def _date_to_utc_start(day: date) -> datetime:
    return datetime.combine(day, time.min, tzinfo=timezone.utc)


def _date_to_utc_end_exclusive(day: date) -> datetime:
    return datetime.combine(day, time.min, tzinfo=timezone.utc) + timedelta(days=1)


def list_user_sessions(
    db: Session,
    *,
    user_id: UUID,
    query: UserSessionHistoryQuery,
) -> PaginatedUserSessionsResponse:
    filters = [
        WorkoutSession.user_id == user_id,
        WorkoutSession.completed_at.is_not(None),
    ]

    if query.start_date is not None:
        filters.append(WorkoutSession.completed_at >= _date_to_utc_start(query.start_date))
    if query.end_date is not None:
        filters.append(WorkoutSession.completed_at < _date_to_utc_end_exclusive(query.end_date))
    if query.workout_type is not None:
        filters.append(WorkoutSession.workout.has(Workout.type == query.workout_type))
    if query.muscle_group_id is not None:
        filters.append(
            WorkoutSession.workout.has(Workout.muscle_groups.any(MuscleGroup.id == query.muscle_group_id))
        )

    total = db.scalar(select(func.count(WorkoutSession.id)).where(*filters)) or 0
    offset = (query.page - 1) * query.page_size

    sessions = (
        db.scalars(
            select(WorkoutSession)
            .where(*filters)
            .options(*_with_history_relations())
            .order_by(WorkoutSession.completed_at.desc(), WorkoutSession.updated_at.desc())
            .offset(offset)
            .limit(query.page_size)
        )
        .unique()
        .all()
    )

    items = [_to_history_item(session) for session in sessions]
    total_pages = (total + query.page_size - 1) // query.page_size if total else 0

    return PaginatedUserSessionsResponse(
        items=items,
        page=query.page,
        page_size=query.page_size,
        total=int(total),
        total_pages=total_pages,
    )


def _resolve_progress_date_range(query: ProgressDateRangeQuery) -> tuple[date, date]:
    today = datetime.now(timezone.utc).date()
    start = query.start_date or (today - timedelta(days=29))
    end = query.end_date or today
    return start, end


def _session_totals(session: WorkoutSession) -> tuple[float, int]:
    total_volume = 0.0
    total_duration = 0
    for log in session.logs:
        if log.weight is not None:
            sets_value = int(log.sets or 1)
            reps_value = int(log.reps or 1)
            total_volume += float(log.weight) * sets_value * reps_value
        elif log.duration is not None:
            total_volume += float(log.duration)
            total_duration += int(log.duration)
    return total_volume, total_duration


def get_muscle_group_progress(
    db: Session,
    *,
    user_id: UUID,
    query: ProgressDateRangeQuery,
) -> MuscleGroupProgressResponse:
    start_date, end_date = _resolve_progress_date_range(query)
    filters = [
        WorkoutSession.user_id == user_id,
        WorkoutSession.completed_at.is_not(None),
        WorkoutSession.completed_at >= _date_to_utc_start(start_date),
        WorkoutSession.completed_at < _date_to_utc_end_exclusive(end_date),
    ]

    sessions = (
        db.scalars(
            select(WorkoutSession)
            .where(*filters)
            .options(*_with_history_relations())
            .order_by(WorkoutSession.completed_at.desc())
        )
        .unique()
        .all()
    )

    aggregates: dict[UUID, MuscleGroupProgressItemResponse] = {}

    for session in sessions:
        workout = session.workout
        if workout is None:
            continue
        if not workout.muscle_groups:
            continue

        session_volume, session_duration = _session_totals(session)
        for group in workout.muscle_groups:
            existing = aggregates.get(group.id)
            if existing is None:
                aggregates[group.id] = MuscleGroupProgressItemResponse(
                    muscle_group_id=group.id,
                    muscle_group_name=group.name,
                    total_volume=round(session_volume, 2),
                    total_duration=session_duration,
                    total_sessions=1,
                )
            else:
                existing.total_volume = round(existing.total_volume + session_volume, 2)
                existing.total_duration += session_duration
                existing.total_sessions += 1

    items = sorted(
        aggregates.values(),
        key=lambda row: (-row.total_volume, row.muscle_group_name.lower()),
    )

    return MuscleGroupProgressResponse(
        start_date=start_date,
        end_date=end_date,
        items=items,
    )


def _month_start(day: date) -> date:
    return day.replace(day=1)


def _next_month_start(day: date) -> date:
    if day.month == 12:
        return date(day.year + 1, 1, 1)
    return date(day.year, day.month + 1, 1)


def _shift_month(day: date, months_delta: int) -> date:
    year = day.year
    month = day.month + months_delta
    while month <= 0:
        month += 12
        year -= 1
    while month > 12:
        month -= 12
        year += 1
    return date(year, month, 1)


def _resolve_frequency_range(query: FrequencyProgressQuery) -> tuple[date, date]:
    today = datetime.now(timezone.utc).date()
    if query.start_date and query.end_date:
        return query.start_date, query.end_date
    if query.start_date and not query.end_date:
        return query.start_date, today
    if query.end_date and not query.start_date:
        if query.period == "monthly":
            return _shift_month(_month_start(query.end_date), -5), query.end_date
        return query.end_date - timedelta(days=55), query.end_date

    if query.period == "monthly":
        return _shift_month(_month_start(today), -5), today
    return today - timedelta(days=55), today


def _iterate_weekly_buckets(start_date: date, end_date: date) -> list[tuple[date, date, str]]:
    bucket_start = start_date - timedelta(days=start_date.weekday())
    buckets: list[tuple[date, date, str]] = []
    while bucket_start <= end_date:
        bucket_end = min(bucket_start + timedelta(days=6), end_date)
        label = f"Week of {bucket_start.strftime('%b %d')}"
        buckets.append((bucket_start, bucket_end, label))
        bucket_start += timedelta(days=7)
    return buckets


def _iterate_monthly_buckets(start_date: date, end_date: date) -> list[tuple[date, date, str]]:
    bucket_start = _month_start(start_date)
    buckets: list[tuple[date, date, str]] = []
    while bucket_start <= end_date:
        next_start = _next_month_start(bucket_start)
        bucket_end = min(next_start - timedelta(days=1), end_date)
        label = bucket_start.strftime("%b %Y")
        buckets.append((bucket_start, bucket_end, label))
        bucket_start = next_start
    return buckets


def get_frequency_progress(
    db: Session,
    *,
    user_id: UUID,
    query: FrequencyProgressQuery,
) -> FrequencyProgressResponse:
    start_date, end_date = _resolve_frequency_range(query)

    completed_rows = db.scalars(
        select(WorkoutSession.completed_at).where(
            WorkoutSession.user_id == user_id,
            WorkoutSession.completed_at.is_not(None),
            WorkoutSession.completed_at >= _date_to_utc_start(start_date),
            WorkoutSession.completed_at < _date_to_utc_end_exclusive(end_date),
        )
    ).all()
    completed_dates = [completed.date() for completed in completed_rows if completed]
    per_day_counts = Counter(completed_dates)

    if query.period == "monthly":
        raw_buckets = _iterate_monthly_buckets(start_date, end_date)
    else:
        raw_buckets = _iterate_weekly_buckets(start_date, end_date)

    buckets: list[FrequencyBucketResponse] = []
    total_sessions = 0

    for bucket_start, bucket_end, label in raw_buckets:
        count = 0
        cursor = bucket_start
        while cursor <= bucket_end:
            count += per_day_counts.get(cursor, 0)
            cursor += timedelta(days=1)

        total_sessions += count
        buckets.append(
            FrequencyBucketResponse(
                label=label,
                start_date=bucket_start,
                end_date=bucket_end,
                session_count=count,
            )
        )

    return FrequencyProgressResponse(
        period=query.period,
        start_date=start_date,
        end_date=end_date,
        total_sessions=total_sessions,
        buckets=buckets,
    )
