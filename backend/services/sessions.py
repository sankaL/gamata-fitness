"""Service logic for workout session execution flows."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from models.enums import PlanAssignmentStatus, SessionType
from models.plan import PlanAssignment, PlanDay, PlanDayWorkout
from models.session import ExerciseLog, WorkoutSession
from models.workout import Workout
from schemas.sessions import (
    SessionCreateRequest,
    SessionLogCreateRequest,
    SessionLogResponse,
    SessionLogUpdateRequest,
    SessionResponse,
    SessionUpdateRequest,
    SessionWorkoutMuscleGroupResponse,
    SessionWorkoutSummaryResponse,
)

logger = logging.getLogger(__name__)
SESSION_EDIT_WINDOW_HOURS = 24


class SessionServiceError(Exception):
    """Raised when session execution flows fail with client-safe messages."""

    def __init__(self, detail: str, status_code: int) -> None:
        super().__init__(detail)
        self.detail = detail
        self.status_code = status_code


def _with_session_relations() -> tuple:
    return (
        selectinload(WorkoutSession.workout).selectinload(Workout.muscle_groups),
        selectinload(WorkoutSession.logs),
    )


def _get_workout_or_404(db: Session, workout_id: UUID) -> Workout:
    workout = db.scalar(
        select(Workout)
        .where(Workout.id == workout_id)
        .options(selectinload(Workout.muscle_groups))
    )
    if workout is None:
        raise SessionServiceError("Workout not found.", 404)
    return workout


def _assert_user_has_active_plan_assignment(db: Session, *, user_id: UUID, plan_id: UUID) -> None:
    assignment = db.scalar(
        select(PlanAssignment.id).where(
            PlanAssignment.user_id == user_id,
            PlanAssignment.plan_id == plan_id,
            PlanAssignment.status == PlanAssignmentStatus.ACTIVE,
        )
    )
    if assignment is None:
        raise SessionServiceError("You do not have an active assignment for this plan.", 403)


def _is_workout_in_plan(db: Session, *, plan_id: UUID, workout_id: UUID) -> bool:
    count = db.scalar(
        select(func.count(PlanDayWorkout.workout_id))
        .join(PlanDay, PlanDay.id == PlanDayWorkout.plan_day_id)
        .where(
            PlanDay.plan_id == plan_id,
            PlanDayWorkout.workout_id == workout_id,
        )
    )
    return int(count or 0) > 0


def _get_user_session_or_404(db: Session, *, session_id: UUID, user_id: UUID) -> WorkoutSession:
    session = db.scalar(
        select(WorkoutSession)
        .where(WorkoutSession.id == session_id, WorkoutSession.user_id == user_id)
        .execution_options(populate_existing=True)
        .options(*_with_session_relations())
    )
    if session is None:
        raise SessionServiceError("Workout session not found.", 404)
    return session


def _assert_session_editable(session: WorkoutSession) -> None:
    if session.completed_at is None:
        return

    completed_at = session.completed_at
    if completed_at.tzinfo is None:
        completed_at = completed_at.replace(tzinfo=timezone.utc)

    edit_deadline = completed_at + timedelta(hours=SESSION_EDIT_WINDOW_HOURS)
    if datetime.now(timezone.utc) > edit_deadline:
        raise SessionServiceError(
            "Session can only be edited for 24 hours after completion.",
            400,
        )


def _to_workout_summary(workout: Workout) -> SessionWorkoutSummaryResponse:
    groups = sorted(workout.muscle_groups, key=lambda group: group.name.lower())
    return SessionWorkoutSummaryResponse(
        id=workout.id,
        name=workout.name,
        type=workout.type,
        target_sets=workout.target_sets,
        target_reps=workout.target_reps,
        suggested_weight=workout.suggested_weight,
        target_duration=workout.target_duration,
        muscle_groups=[
            SessionWorkoutMuscleGroupResponse(id=group.id, name=group.name, icon=group.icon)
            for group in groups
        ],
    )


def _to_log_response(log: ExerciseLog) -> SessionLogResponse:
    return SessionLogResponse(
        id=log.id,
        sets=log.sets,
        reps=log.reps,
        weight=log.weight,
        duration=log.duration,
        notes=log.notes,
        logged_at=log.logged_at,
        updated_at=log.updated_at,
    )


def _to_session_response(session: WorkoutSession) -> SessionResponse:
    ordered_logs = sorted(
        session.logs,
        key=lambda log: (log.logged_at, str(log.id)),
    )
    return SessionResponse(
        id=session.id,
        user_id=session.user_id,
        workout_id=session.workout_id,
        plan_id=session.plan_id,
        session_type=session.session_type,
        completed_at=session.completed_at,
        updated_at=session.updated_at,
        workout=_to_workout_summary(session.workout),
        logs=[_to_log_response(log) for log in ordered_logs],
    )


def create_session(
    db: Session,
    *,
    user_id: UUID,
    payload: SessionCreateRequest,
) -> SessionResponse:
    workout = _get_workout_or_404(db, payload.workout_id)
    if workout.is_archived:
        raise SessionServiceError("Archived workouts cannot be used for new sessions.", 400)

    if payload.session_type == SessionType.ADHOC and payload.plan_id is not None:
        raise SessionServiceError("Ad hoc sessions cannot include a plan_id.", 400)
    if payload.session_type in (SessionType.ASSIGNED, SessionType.SWAP) and payload.plan_id is None:
        raise SessionServiceError("Assigned and swap sessions require a plan_id.", 400)

    if payload.plan_id is not None:
        _assert_user_has_active_plan_assignment(db, user_id=user_id, plan_id=payload.plan_id)
        if payload.session_type == SessionType.ASSIGNED and not _is_workout_in_plan(
            db,
            plan_id=payload.plan_id,
            workout_id=payload.workout_id,
        ):
            raise SessionServiceError("Workout is not part of the active assigned plan.", 400)

    session = WorkoutSession(
        id=uuid4(),
        user_id=user_id,
        workout_id=payload.workout_id,
        plan_id=payload.plan_id,
        session_type=payload.session_type,
        completed_at=None,
    )
    db.add(session)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        logger.exception("Failed creating session for user %s", user_id)
        raise SessionServiceError("Unable to create workout session.", 500) from exc

    hydrated = _get_user_session_or_404(db, session_id=session.id, user_id=user_id)
    return _to_session_response(hydrated)


def get_session(db: Session, *, user_id: UUID, session_id: UUID) -> SessionResponse:
    session = _get_user_session_or_404(db, session_id=session_id, user_id=user_id)
    return _to_session_response(session)


def update_session(
    db: Session,
    *,
    user_id: UUID,
    session_id: UUID,
    payload: SessionUpdateRequest,
) -> SessionResponse:
    session = _get_user_session_or_404(db, session_id=session_id, user_id=user_id)
    _assert_session_editable(session)

    existing_log_map = {log.id: log for log in session.logs}

    for item in payload.logs:
        if item.id is None:
            db.add(
                ExerciseLog(
                    id=uuid4(),
                    session_id=session.id,
                    sets=item.sets,
                    reps=item.reps,
                    weight=item.weight,
                    duration=item.duration,
                    notes=item.notes,
                )
            )
            continue

        current_log = existing_log_map.get(item.id)
        if current_log is None:
            raise SessionServiceError("One or more logs do not belong to this session.", 404)

        current_log.sets = item.sets
        current_log.reps = item.reps
        current_log.weight = item.weight
        current_log.duration = item.duration
        current_log.notes = item.notes

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        logger.exception("Failed updating session %s", session_id)
        raise SessionServiceError("Unable to update workout session.", 500) from exc

    hydrated = _get_user_session_or_404(db, session_id=session.id, user_id=user_id)
    return _to_session_response(hydrated)


def complete_session(db: Session, *, user_id: UUID, session_id: UUID) -> SessionResponse:
    session = _get_user_session_or_404(db, session_id=session_id, user_id=user_id)
    if session.completed_at is None:
        session.completed_at = datetime.now(timezone.utc)
        try:
            db.commit()
        except Exception as exc:  # noqa: BLE001
            db.rollback()
            logger.exception("Failed completing session %s", session_id)
            raise SessionServiceError("Unable to complete workout session.", 500) from exc

    hydrated = _get_user_session_or_404(db, session_id=session.id, user_id=user_id)
    return _to_session_response(hydrated)


def add_session_log(
    db: Session,
    *,
    user_id: UUID,
    session_id: UUID,
    payload: SessionLogCreateRequest,
) -> SessionResponse:
    session = _get_user_session_or_404(db, session_id=session_id, user_id=user_id)
    _assert_session_editable(session)

    db.add(
        ExerciseLog(
            id=uuid4(),
            session_id=session.id,
            sets=payload.sets,
            reps=payload.reps,
            weight=payload.weight,
            duration=payload.duration,
            notes=payload.notes,
        )
    )

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        logger.exception("Failed adding log to session %s", session_id)
        raise SessionServiceError("Unable to add exercise log.", 500) from exc

    hydrated = _get_user_session_or_404(db, session_id=session.id, user_id=user_id)
    return _to_session_response(hydrated)


def update_session_log(
    db: Session,
    *,
    user_id: UUID,
    session_id: UUID,
    log_id: UUID,
    payload: SessionLogUpdateRequest,
) -> SessionResponse:
    session = _get_user_session_or_404(db, session_id=session_id, user_id=user_id)
    _assert_session_editable(session)

    log = db.scalar(
        select(ExerciseLog).where(ExerciseLog.id == log_id, ExerciseLog.session_id == session.id)
    )
    if log is None:
        raise SessionServiceError("Exercise log not found for this session.", 404)

    updates = payload.model_dump(exclude_unset=True)
    if "sets" in updates:
        log.sets = updates["sets"]
    if "reps" in updates:
        log.reps = updates["reps"]
    if "weight" in updates:
        log.weight = updates["weight"]
    if "duration" in updates:
        log.duration = updates["duration"]
    if "notes" in updates:
        log.notes = updates["notes"]

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        logger.exception("Failed updating log %s on session %s", log_id, session_id)
        raise SessionServiceError("Unable to update exercise log.", 500) from exc

    hydrated = _get_user_session_or_404(db, session_id=session.id, user_id=user_id)
    return _to_session_response(hydrated)
