"""Plan service tests."""

from __future__ import annotations

from datetime import date, datetime, timezone
from uuid import uuid4

import pytest
from models import Base
from models.enums import (PlanAssignmentStatus, SessionType, UserRole,
                          WorkoutType)
from models.plan import PlanAssignment, WorkoutPlan
from models.session import WorkoutSession
from models.user import CoachUserAssignment, User
from models.workout import MuscleGroup, Workout
from schemas.plans import PlanAssignRequest, PlanCreateRequest
from services.plans import (PlanServiceError, assign_plan_to_users,
                            create_plan, get_coach_roster,
                            get_plan_users_status)
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
        email=f'{name.lower().replace(" ", "-")}-{uuid4()}@gamata.test',
        role=role,
        is_active=True,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def _create_workout(session: Session, group: MuscleGroup, name: str) -> Workout:
    workout = Workout(
        id=uuid4(),
        name=name,
        type=WorkoutType.STRENGTH,
        target_sets=3,
        target_reps=10,
        is_archived=False,
    )
    workout.muscle_groups = [group]
    session.add(workout)
    session.commit()
    session.refresh(workout)
    return workout


def test_assign_plan_sets_pending_when_user_has_active_plan(
    db_session: Session,
) -> None:
    coach = _create_user(db_session, role=UserRole.COACH, name="Coach One")
    athlete_a = _create_user(db_session, role=UserRole.USER, name="Athlete A")
    athlete_b = _create_user(db_session, role=UserRole.USER, name="Athlete B")

    group = MuscleGroup(id=uuid4(), name="Chest", icon="chest", is_default=True)
    db_session.add(group)
    db_session.commit()

    workout = _create_workout(db_session, group, "Press A")

    db_session.add_all(
        [
            CoachUserAssignment(
                id=uuid4(),
                coach_id=coach.id,
                user_id=athlete_a.id,
                assigned_by=coach.id,
            ),
            CoachUserAssignment(
                id=uuid4(),
                coach_id=coach.id,
                user_id=athlete_b.id,
                assigned_by=coach.id,
            ),
        ]
    )
    db_session.commit()

    existing_plan = WorkoutPlan(
        id=uuid4(),
        name="Existing Plan",
        coach_id=coach.id,
        start_date=date(2026, 2, 1),
        end_date=date(2026, 2, 15),
        is_archived=False,
    )
    db_session.add(existing_plan)
    db_session.flush()
    db_session.add(
        PlanAssignment(
            id=uuid4(),
            plan_id=existing_plan.id,
            user_id=athlete_a.id,
            status=PlanAssignmentStatus.ACTIVE,
            activated_at=datetime.now(timezone.utc),
        )
    )
    db_session.commit()

    new_plan = create_plan(
        db_session,
        coach_id=coach.id,
        payload=PlanCreateRequest(
            name="New Plan",
            start_date=date(2026, 2, 16),
            end_date=date(2026, 2, 28),
            days=[
                {
                    "day_of_week": 0,
                    "workout_ids": [workout.id],
                }
            ],
        ),
    )

    response = assign_plan_to_users(
        db_session,
        coach_id=coach.id,
        plan_id=new_plan.id,
        payload=PlanAssignRequest(user_ids=[athlete_a.id, athlete_b.id]),
    )

    statuses = {item.user_id: item.status for item in response.assignments}
    assert statuses[athlete_a.id] == PlanAssignmentStatus.PENDING
    assert statuses[athlete_b.id] == PlanAssignmentStatus.ACTIVE


def test_get_plan_users_status_calculates_weekly_completion(
    db_session: Session,
) -> None:
    coach = _create_user(db_session, role=UserRole.COACH, name="Coach Metrics")
    athlete = _create_user(db_session, role=UserRole.USER, name="Athlete Metrics")

    group = MuscleGroup(id=uuid4(), name="Back", icon="back", is_default=True)
    db_session.add(group)
    db_session.commit()

    workout_a = _create_workout(db_session, group, "Row A")
    workout_b = _create_workout(db_session, group, "Row B")

    db_session.add(
        CoachUserAssignment(
            id=uuid4(),
            coach_id=coach.id,
            user_id=athlete.id,
            assigned_by=coach.id,
        )
    )
    db_session.commit()

    plan = create_plan(
        db_session,
        coach_id=coach.id,
        payload=PlanCreateRequest(
            name="Metrics Plan",
            start_date=date(2026, 2, 10),
            end_date=date(2026, 2, 20),
            days=[
                {
                    "day_of_week": 0,
                    "workout_ids": [workout_a.id, workout_b.id],
                }
            ],
        ),
    )

    assign_response = assign_plan_to_users(
        db_session,
        coach_id=coach.id,
        plan_id=plan.id,
        payload=PlanAssignRequest(user_ids=[athlete.id]),
    )
    assert assign_response.assignments[0].status == PlanAssignmentStatus.ACTIVE

    db_session.add(
        WorkoutSession(
            id=uuid4(),
            user_id=athlete.id,
            workout_id=workout_a.id,
            plan_id=plan.id,
            session_type=SessionType.ASSIGNED,
            completed_at=datetime.now(timezone.utc),
        )
    )
    db_session.commit()

    response = get_plan_users_status(db_session, coach_id=coach.id, plan_id=plan.id)

    assert response.users[0].weekly_completion_percent == 50.0


def test_get_coach_roster_blocks_other_coaches(db_session: Session) -> None:
    coach_a = _create_user(db_session, role=UserRole.COACH, name="Coach A")
    coach_b = _create_user(db_session, role=UserRole.COACH, name="Coach B")

    with pytest.raises(PlanServiceError) as exc:
        get_coach_roster(
            db_session,
            coach_id=coach_a.id,
            viewer_id=coach_b.id,
            viewer_role=UserRole.COACH,
        )

    assert exc.value.status_code == 403
