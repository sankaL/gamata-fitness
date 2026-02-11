"""Workout service tests."""

from __future__ import annotations

from datetime import date
from uuid import uuid4

import pytest
from models import Base
from models.enums import (CardioDifficultyLevel, PlanAssignmentStatus,
                          UserRole, WorkoutType)
from models.plan import PlanAssignment, PlanDay, WorkoutPlan
from models.user import User
from models.workout import CardioType, MuscleGroup, Workout
from schemas.workouts import WorkoutCreateRequest, WorkoutListQuery
from services.workouts import (WorkoutServiceError, archive_workout,
                               create_workout, list_workouts,
                               unarchive_workout)
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


def _create_user(session: Session, *, role: UserRole) -> User:
    user = User(
        id=uuid4(),
        name=f"{role.value.title()} User",
        email=f"{role.value}-{uuid4()}@gamata.test",
        role=role,
        is_active=True,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def _create_muscle_group(session: Session) -> MuscleGroup:
    group = MuscleGroup(id=uuid4(), name="Legs", icon="legs", is_default=True)
    session.add(group)
    session.commit()
    session.refresh(group)
    return group


def _create_cardio_type(session: Session) -> CardioType:
    cardio = CardioType(id=uuid4(), name="Steady State", description="Steady cardio")
    session.add(cardio)
    session.commit()
    session.refresh(cardio)
    return cardio


def _create_strength_workout(session: Session, group: MuscleGroup) -> Workout:
    workout = Workout(
        id=uuid4(),
        name=f"Squat-{uuid4()}",
        type=WorkoutType.STRENGTH,
        target_sets=4,
        target_reps=8,
        is_archived=False,
    )
    workout.muscle_groups = [group]
    session.add(workout)
    session.commit()
    session.refresh(workout)
    return workout


def test_list_workouts_applies_type_filter(db_session: Session) -> None:
    group = _create_muscle_group(db_session)
    cardio = _create_cardio_type(db_session)

    strength = _create_strength_workout(db_session, group)

    cardio_workout = Workout(
        id=uuid4(),
        name=f"Run-{uuid4()}",
        type=WorkoutType.CARDIO,
        cardio_type_id=cardio.id,
        target_duration=20,
        difficulty_level=CardioDifficultyLevel.MEDIUM,
        is_archived=False,
    )
    cardio_workout.muscle_groups = [group]
    db_session.add(cardio_workout)
    db_session.commit()

    response = list_workouts(
        db_session,
        WorkoutListQuery(page=1, page_size=10, type=WorkoutType.STRENGTH),
    )

    assert response.total == 1
    assert response.items[0].id == strength.id


def test_archive_workout_blocks_active_plan_dependencies(db_session: Session) -> None:
    group = _create_muscle_group(db_session)
    coach = _create_user(db_session, role=UserRole.COACH)
    athlete = _create_user(db_session, role=UserRole.USER)
    workout = _create_strength_workout(db_session, group)

    plan = WorkoutPlan(
        id=uuid4(),
        name="Strength Builder",
        coach_id=coach.id,
        start_date=date(2026, 2, 10),
        end_date=date(2026, 2, 20),
        is_archived=False,
    )
    day = PlanDay(id=uuid4(), day_of_week=0)
    day.workouts = [workout]
    plan.days = [day]
    db_session.add(plan)
    db_session.flush()

    db_session.add(
        PlanAssignment(
            id=uuid4(),
            plan_id=plan.id,
            user_id=athlete.id,
            status=PlanAssignmentStatus.ACTIVE,
        )
    )
    db_session.commit()

    with pytest.raises(WorkoutServiceError) as exc:
        archive_workout(db_session, workout.id)

    assert exc.value.status_code == 409
    assert "active plans" in exc.value.detail


def test_unarchive_workout_restores_archived_flag(db_session: Session) -> None:
    group = _create_muscle_group(db_session)
    workout = _create_strength_workout(db_session, group)

    workout.is_archived = True
    db_session.commit()

    response = unarchive_workout(db_session, workout.id)

    assert response.is_archived is False


def test_create_workout_supports_strength_payload(db_session: Session) -> None:
    group = _create_muscle_group(db_session)

    response = create_workout(
        db_session,
        WorkoutCreateRequest(
            name="Bench Press New",
            type="strength",
            target_sets=3,
            target_reps=10,
            muscle_group_ids=[group.id],
        ),
    )

    assert response.name == "Bench Press New"
    assert response.type == WorkoutType.STRENGTH
    assert response.target_sets == 3
