"""Service tests for Phase 10 and 11 workflows."""

from __future__ import annotations

from datetime import date, datetime, timezone
from uuid import uuid4

import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker

from models import Base
from models.enums import PlanAssignmentStatus, UserRole, WorkoutType
from models.plan import PlanAssignment, PlanDay, WorkoutPlan
from models.user import User
from models.workout import CardioType, MuscleGroup, Workout
from schemas.users import UserCreateRequest
from services.import_export import import_users_csv, import_workouts_csv
from services.plan_activation import (
    activate_pending_plan_assignment,
    decline_pending_plan_assignment,
    get_user_pending_plan_assignments,
)


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


def _create_strength_workout(session: Session, group: MuscleGroup, name: str) -> Workout:
    workout = Workout(
        id=uuid4(),
        name=name,
        type=WorkoutType.STRENGTH,
        target_sets=4,
        target_reps=10,
        is_archived=False,
    )
    workout.muscle_groups = [group]
    session.add(workout)
    session.commit()
    session.refresh(workout)
    return workout


def test_activate_pending_plan_deactivates_current_active(db_session: Session) -> None:
    coach = _create_user(db_session, role=UserRole.COACH, name="Coach Activate")
    athlete = _create_user(db_session, role=UserRole.USER, name="Athlete Activate")
    group = MuscleGroup(id=uuid4(), name="Legs", icon="legs", is_default=True)
    db_session.add(group)
    db_session.commit()

    workout_a = _create_strength_workout(db_session, group, "Plan A Squat")
    workout_b = _create_strength_workout(db_session, group, "Plan B Squat")

    plan_a = WorkoutPlan(
        id=uuid4(),
        name="Current Plan",
        coach_id=coach.id,
        start_date=date(2026, 2, 1),
        end_date=date(2026, 2, 20),
        is_archived=False,
    )
    day_a = PlanDay(id=uuid4(), day_of_week=0)
    day_a.workouts = [workout_a]
    plan_a.days = [day_a]
    db_session.add(plan_a)

    plan_b = WorkoutPlan(
        id=uuid4(),
        name="Pending Plan",
        coach_id=coach.id,
        start_date=date(2026, 2, 21),
        end_date=date(2026, 3, 20),
        is_archived=False,
    )
    day_b = PlanDay(id=uuid4(), day_of_week=2)
    day_b.workouts = [workout_b]
    plan_b.days = [day_b]
    db_session.add(plan_b)
    db_session.flush()

    active_assignment = PlanAssignment(
        id=uuid4(),
        plan_id=plan_a.id,
        user_id=athlete.id,
        status=PlanAssignmentStatus.ACTIVE,
        activated_at=datetime.now(timezone.utc),
    )
    pending_assignment = PlanAssignment(
        id=uuid4(),
        plan_id=plan_b.id,
        user_id=athlete.id,
        status=PlanAssignmentStatus.PENDING,
    )
    db_session.add_all([active_assignment, pending_assignment])
    db_session.commit()

    response = activate_pending_plan_assignment(
        db_session,
        user_id=athlete.id,
        assignment_id=pending_assignment.id,
    )

    assert response.status == PlanAssignmentStatus.ACTIVE
    assert response.assignment_id == pending_assignment.id
    assert response.deactivated_assignment_ids == [active_assignment.id]

    refreshed_active = db_session.get(PlanAssignment, active_assignment.id)
    assert refreshed_active is not None
    assert refreshed_active.status == PlanAssignmentStatus.INACTIVE
    assert refreshed_active.deactivated_at is not None


def test_get_pending_plans_response_contains_active_and_pending(db_session: Session) -> None:
    coach = _create_user(db_session, role=UserRole.COACH, name="Coach Pending")
    athlete = _create_user(db_session, role=UserRole.USER, name="Athlete Pending")
    group = MuscleGroup(id=uuid4(), name="Back", icon="back", is_default=True)
    db_session.add(group)
    db_session.commit()

    workout = _create_strength_workout(db_session, group, "Row Pending")

    active_plan = WorkoutPlan(
        id=uuid4(),
        name="Active Plan",
        coach_id=coach.id,
        start_date=date(2026, 2, 1),
        end_date=date(2026, 2, 14),
        is_archived=False,
    )
    active_day = PlanDay(id=uuid4(), day_of_week=0)
    active_day.workouts = [workout]
    active_plan.days = [active_day]
    db_session.add(active_plan)

    pending_plan = WorkoutPlan(
        id=uuid4(),
        name="Pending Plan",
        coach_id=coach.id,
        start_date=date(2026, 2, 15),
        end_date=date(2026, 2, 28),
        is_archived=False,
    )
    pending_day = PlanDay(id=uuid4(), day_of_week=1)
    pending_day.workouts = [workout]
    pending_plan.days = [pending_day]
    db_session.add(pending_plan)
    db_session.flush()

    db_session.add_all(
        [
            PlanAssignment(
                id=uuid4(),
                plan_id=active_plan.id,
                user_id=athlete.id,
                status=PlanAssignmentStatus.ACTIVE,
                activated_at=datetime.now(timezone.utc),
            ),
            PlanAssignment(
                id=uuid4(),
                plan_id=pending_plan.id,
                user_id=athlete.id,
                status=PlanAssignmentStatus.PENDING,
            ),
        ]
    )
    db_session.commit()

    response = get_user_pending_plan_assignments(db_session, user_id=athlete.id)

    assert response.active_plan is not None
    assert response.active_plan.plan_name == "Active Plan"
    assert len(response.pending_assignments) == 1
    assert response.pending_assignments[0].plan_name == "Pending Plan"
    assert response.pending_assignments[0].total_workouts == 1


def test_decline_pending_plan_marks_assignment_inactive(db_session: Session) -> None:
    coach = _create_user(db_session, role=UserRole.COACH, name="Coach Decline")
    athlete = _create_user(db_session, role=UserRole.USER, name="Athlete Decline")
    plan = WorkoutPlan(
        id=uuid4(),
        name="Decline Plan",
        coach_id=coach.id,
        start_date=date(2026, 2, 1),
        end_date=date(2026, 2, 14),
        is_archived=False,
    )
    db_session.add(plan)
    db_session.flush()

    assignment = PlanAssignment(
        id=uuid4(),
        plan_id=plan.id,
        user_id=athlete.id,
        status=PlanAssignmentStatus.PENDING,
    )
    db_session.add(assignment)
    db_session.commit()

    response = decline_pending_plan_assignment(
        db_session,
        user_id=athlete.id,
        assignment_id=assignment.id,
    )

    assert response.status == PlanAssignmentStatus.INACTIVE
    refreshed = db_session.get(PlanAssignment, assignment.id)
    assert refreshed is not None
    assert refreshed.status == PlanAssignmentStatus.INACTIVE
    assert refreshed.deactivated_at is not None


def test_import_users_csv_reports_validation_errors(db_session: Session, monkeypatch: pytest.MonkeyPatch) -> None:
    def _fake_create_user(db: Session, payload: UserCreateRequest):  # type: ignore[name-defined]
        user = User(
            id=uuid4(),
            name=payload.name,
            email=payload.email,
            role=payload.role,
            is_active=True,
        )
        db.add(user)
        db.commit()
        return user

    monkeypatch.setattr("services.import_export_importers.create_user", _fake_create_user)

    csv_content = "\n".join(
        [
            "name,email,role,password",
            "Valid User,valid@gamata.test,user,supersecret",
            "Bad Role,bad-role@gamata.test,manager,supersecret",
            "Missing Email,,user,supersecret",
        ]
    )

    response = import_users_csv(db_session, content=csv_content)

    assert response.total_rows == 3
    assert response.imported_rows == 1
    assert len(response.errors) == 2
    assert {error.row_number for error in response.errors} == {3, 4}


def test_import_workouts_csv_imports_strength_and_cardio(db_session: Session) -> None:
    group = MuscleGroup(id=uuid4(), name="Chest", icon="chest", is_default=True)
    cardio_type = CardioType(id=uuid4(), name="HIIT", description="High intensity")
    db_session.add_all([group, cardio_type])
    db_session.commit()

    csv_content = "\n".join(
        [
            "name,type,muscle_groups,target_sets,target_reps,suggested_weight,cardio_type,target_duration,difficulty_level",
            "Bench Press,strength,Chest,4,10,60,,,",
            "Sprints,cardio,Chest,,,,HIIT,15,hard",
        ]
    )

    response = import_workouts_csv(db_session, content=csv_content)

    assert response.total_rows == 2
    assert response.imported_rows == 2
    assert response.errors == []
