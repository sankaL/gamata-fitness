"""Service tests for Phase 7, 8, and 9 workflows."""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from uuid import uuid4

import pytest
from models import Base
from models.enums import PlanAssignmentStatus, SessionType, UserRole, WorkoutType
from models.plan import PlanAssignment, PlanDay, WorkoutPlan
from models.session import ExerciseLog, WorkoutSession
from models.user import CoachUserAssignment, User
from models.workout import MuscleGroup, Workout
from schemas.progress import ProgressDateRangeQuery, UserSessionHistoryQuery
from schemas.sessions import SessionCreateRequest, SessionLogUpdateRequest, SessionUpdateRequest
from services.progress import get_muscle_group_progress, list_user_sessions
from services.sessions import (
    SessionServiceError,
    complete_session,
    create_session,
    update_session,
    update_session_log,
)
from services.user_dashboard import get_user_quick_stats, get_user_today_workout
from services.workouts import list_alternative_workouts
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker


@pytest.fixture()
def db_session() -> Session:
    engine = create_engine("sqlite+pysqlite:///:memory:", future=True)

    @event.listens_for(engine, "connect")
    def _register_sqlite_uuid_function(dbapi_connection, _connection_record) -> None:
        dbapi_connection.create_function("gen_random_uuid", 0, lambda: str(uuid4()))

    Base.metadata.create_all(engine)
    testing_session_local = sessionmaker(
        bind=engine,
        autoflush=False,
        autocommit=False,
        expire_on_commit=False,
    )
    session = testing_session_local()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(engine)
        engine.dispose()


def _create_user(session: Session, *, role: UserRole, name: str) -> User:
    user = User(
        id=uuid4(),
        name=name,
        email=f"{name.lower().replace(' ', '-')}-{uuid4()}@gamata.test",
        role=role,
        is_active=True,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def _create_group(session: Session, *, name: str) -> MuscleGroup:
    group = MuscleGroup(id=uuid4(), name=name, icon=name.lower(), is_default=True)
    session.add(group)
    session.commit()
    session.refresh(group)
    return group


def _create_strength_workout(session: Session, group: MuscleGroup, name: str) -> Workout:
    workout = Workout(
        id=uuid4(),
        name=name,
        type=WorkoutType.STRENGTH,
        target_sets=3,
        target_reps=10,
        suggested_weight=40,
        is_archived=False,
    )
    workout.muscle_groups = [group]
    session.add(workout)
    session.commit()
    session.refresh(workout)
    return workout


def _create_active_assignment(
    session: Session,
    *,
    coach: User,
    athlete: User,
    workout: Workout,
    day_of_week: int,
) -> WorkoutPlan:
    session.add(
        CoachUserAssignment(
            id=uuid4(),
            coach_id=coach.id,
            user_id=athlete.id,
            assigned_by=coach.id,
        )
    )
    session.commit()

    plan = WorkoutPlan(
        id=uuid4(),
        name="Assigned Plan",
        coach_id=coach.id,
        start_date=date(2026, 2, 1),
        end_date=date(2026, 3, 1),
        is_archived=False,
    )
    day = PlanDay(id=uuid4(), day_of_week=day_of_week)
    day.workouts = [workout]
    plan.days = [day]
    session.add(plan)
    session.flush()

    session.add(
        PlanAssignment(
            id=uuid4(),
            plan_id=plan.id,
            user_id=athlete.id,
            status=PlanAssignmentStatus.ACTIVE,
            activated_at=datetime.now(timezone.utc),
        )
    )
    session.commit()
    session.refresh(plan)
    return plan


def test_create_update_complete_session_flow(db_session: Session) -> None:
    today_weekday = datetime.now(timezone.utc).date().weekday()
    coach = _create_user(db_session, role=UserRole.COACH, name="Coach Session")
    athlete = _create_user(db_session, role=UserRole.USER, name="Athlete Session")
    group = _create_group(db_session, name="Legs")
    workout = _create_strength_workout(db_session, group, "Squat Session")
    plan = _create_active_assignment(
        db_session,
        coach=coach,
        athlete=athlete,
        workout=workout,
        day_of_week=today_weekday,
    )

    created = create_session(
        db_session,
        user_id=athlete.id,
        payload=SessionCreateRequest(
            workout_id=workout.id,
            plan_id=plan.id,
            session_type=SessionType.ASSIGNED,
        ),
    )
    assert created.plan_id == plan.id

    updated = update_session(
        db_session,
        user_id=athlete.id,
        session_id=created.id,
        payload=SessionUpdateRequest(logs=[{"sets": 3, "reps": 10, "weight": 60}]),
    )
    assert len(updated.logs) == 1
    assert updated.logs[0].sets == 3

    completed = complete_session(db_session, user_id=athlete.id, session_id=created.id)
    assert completed.completed_at is not None


def test_session_edit_window_blocks_log_updates_after_24_hours(db_session: Session) -> None:
    coach = _create_user(db_session, role=UserRole.COACH, name="Coach Window")
    athlete = _create_user(db_session, role=UserRole.USER, name="Athlete Window")
    group = _create_group(db_session, name="Back")
    workout = _create_strength_workout(db_session, group, "Row Window")
    plan = _create_active_assignment(
        db_session,
        coach=coach,
        athlete=athlete,
        workout=workout,
        day_of_week=0,
    )

    old_session = WorkoutSession(
        id=uuid4(),
        user_id=athlete.id,
        workout_id=workout.id,
        plan_id=plan.id,
        session_type=SessionType.ASSIGNED,
        completed_at=datetime.now(timezone.utc) - timedelta(hours=25),
    )
    db_session.add(old_session)
    db_session.flush()
    log = ExerciseLog(
        id=uuid4(),
        session_id=old_session.id,
        sets=3,
        reps=8,
        weight=40,
    )
    db_session.add(log)
    db_session.commit()

    with pytest.raises(SessionServiceError) as exc:
        update_session_log(
            db_session,
            user_id=athlete.id,
            session_id=old_session.id,
            log_id=log.id,
            payload=SessionLogUpdateRequest(reps=10),
        )

    assert exc.value.status_code == 400


def test_dashboard_and_progress_queries_return_expected_data(db_session: Session) -> None:
    today_weekday = datetime.now(timezone.utc).date().weekday()
    coach = _create_user(db_session, role=UserRole.COACH, name="Coach Progress")
    athlete = _create_user(db_session, role=UserRole.USER, name="Athlete Progress")
    group = _create_group(db_session, name="Chest")
    workout = _create_strength_workout(db_session, group, "Bench Progress")
    plan = _create_active_assignment(
        db_session,
        coach=coach,
        athlete=athlete,
        workout=workout,
        day_of_week=today_weekday,
    )

    created = create_session(
        db_session,
        user_id=athlete.id,
        payload=SessionCreateRequest(
            workout_id=workout.id,
            plan_id=plan.id,
            session_type=SessionType.ASSIGNED,
        ),
    )
    _ = update_session(
        db_session,
        user_id=athlete.id,
        session_id=created.id,
        payload=SessionUpdateRequest(logs=[{"sets": 3, "reps": 10, "weight": 70}]),
    )
    _ = complete_session(db_session, user_id=athlete.id, session_id=created.id)

    today = get_user_today_workout(db_session, user_id=athlete.id)
    stats = get_user_quick_stats(db_session, user_id=athlete.id)
    history = list_user_sessions(
        db_session,
        user_id=athlete.id,
        query=UserSessionHistoryQuery(page=1, page_size=10, workout_type=WorkoutType.STRENGTH),
    )
    muscle_progress = get_muscle_group_progress(
        db_session,
        user_id=athlete.id,
        query=ProgressDateRangeQuery(),
    )

    assert today.workouts
    assert stats.sessions_this_week >= 1
    assert history.total == 1
    assert muscle_progress.items[0].total_volume > 0


def test_alternative_workouts_share_muscle_group(db_session: Session) -> None:
    group = _create_group(db_session, name="Shoulders")
    source = _create_strength_workout(db_session, group, "Overhead Press A")
    alternative = _create_strength_workout(db_session, group, "Overhead Press B")

    results = list_alternative_workouts(db_session, workout_id=source.id, limit=10)

    returned_ids = {item.id for item in results}
    assert source.id not in returned_ids
    assert alternative.id in returned_ids
