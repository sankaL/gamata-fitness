"""User management service tests."""

from __future__ import annotations

from uuid import uuid4

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from models import Base
from models.enums import UserRole, WorkoutType
from models.user import CoachUserAssignment, User
from models.workout import Workout
from schemas.users import UserListQuery
from services.users import (
    MAX_USERS_PER_COACH,
    UserServiceError,
    assign_coaches_to_user,
    deactivate_user,
    get_admin_overview,
    list_users,
)


@pytest.fixture()
def db_session() -> Session:
    engine = create_engine("sqlite+pysqlite:///:memory:", future=True)
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


def _create_user(
    session: Session,
    *,
    name: str,
    email: str,
    role: UserRole,
    is_active: bool = True,
) -> User:
    user = User(
        id=uuid4(),
        name=name,
        email=email,
        role=role,
        is_active=is_active,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def test_deactivate_user_marks_user_inactive(db_session: Session) -> None:
    admin = _create_user(
        db_session,
        name="Admin",
        email="admin@gamata.test",
        role=UserRole.ADMIN,
    )
    athlete = _create_user(
        db_session,
        name="Athlete",
        email="athlete@gamata.test",
        role=UserRole.USER,
    )

    response = deactivate_user(db_session, athlete.id, admin.id)

    assert response.is_active is False
    assert response.deactivated_at is not None


def test_deactivate_user_blocks_self_deactivation(db_session: Session) -> None:
    admin = _create_user(
        db_session,
        name="Admin",
        email="self-admin@gamata.test",
        role=UserRole.ADMIN,
    )

    with pytest.raises(UserServiceError) as exc:
        deactivate_user(db_session, admin.id, admin.id)

    assert exc.value.status_code == 400


def test_assign_coaches_enforces_50_user_limit(db_session: Session) -> None:
    admin = _create_user(
        db_session,
        name="Admin",
        email="assign-admin@gamata.test",
        role=UserRole.ADMIN,
    )
    coach = _create_user(
        db_session,
        name="Coach",
        email="coach@gamata.test",
        role=UserRole.COACH,
    )
    target_user = _create_user(
        db_session,
        name="Target",
        email="target@gamata.test",
        role=UserRole.USER,
    )

    for index in range(MAX_USERS_PER_COACH):
        seeded_user = _create_user(
            db_session,
            name=f"Seeded User {index}",
            email=f"seeded-{index}@gamata.test",
            role=UserRole.USER,
        )
        db_session.add(
            CoachUserAssignment(
                id=uuid4(),
                coach_id=coach.id,
                user_id=seeded_user.id,
                assigned_by=admin.id,
            )
        )
    db_session.commit()

    with pytest.raises(UserServiceError) as exc:
        assign_coaches_to_user(
            db_session,
            user_id=target_user.id,
            coach_ids=[coach.id],
            assigned_by_user_id=admin.id,
        )

    assert exc.value.status_code == 400
    assert str(MAX_USERS_PER_COACH) in exc.value.detail


def test_list_users_applies_role_and_status_filters(db_session: Session) -> None:
    _create_user(
        db_session,
        name="Inactive Athlete",
        email="inactive-user@gamata.test",
        role=UserRole.USER,
        is_active=False,
    )
    _create_user(
        db_session,
        name="Active Coach",
        email="active-coach@gamata.test",
        role=UserRole.COACH,
    )

    response = list_users(
        db_session,
        UserListQuery(
            page=1,
            page_size=10,
            role=UserRole.COACH,
            is_active=True,
            search="coach",
        ),
    )

    assert response.total == 1
    assert response.items[0].role == UserRole.COACH
    assert response.items[0].is_active is True


def test_get_admin_overview_counts_dashboard_metrics(db_session: Session) -> None:
    _create_user(
        db_session,
        name="Coach",
        email="overview-coach@gamata.test",
        role=UserRole.COACH,
    )
    _create_user(
        db_session,
        name="Active User",
        email="overview-user@gamata.test",
        role=UserRole.USER,
    )
    _create_user(
        db_session,
        name="Inactive User",
        email="overview-inactive@gamata.test",
        role=UserRole.USER,
        is_active=False,
    )

    db_session.add(
        Workout(
            id=uuid4(),
            name="Overview Workout",
            type=WorkoutType.STRENGTH,
            target_sets=3,
            target_reps=10,
            is_archived=False,
        )
    )
    db_session.commit()

    overview = get_admin_overview(db_session)

    assert overview.total_users == 2
    assert overview.total_coaches == 1
    assert overview.total_workouts == 1
    assert overview.active_users == 2
    assert overview.inactive_users == 1
