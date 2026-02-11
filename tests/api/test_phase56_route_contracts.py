"""Route-level RBAC tests for Phase 5 and 6 endpoints."""

from __future__ import annotations

from uuid import uuid4

import pytest
from fastapi import HTTPException

from api.plans import post_plan
from api.workouts import post_muscle_group, post_workout
from core.permissions import AuthenticatedUser
from models.enums import UserRole
from schemas.plans import PlanCreateRequest
from schemas.workouts import MuscleGroupCreateRequest, WorkoutCreateRequest


def _sample_user(role: UserRole) -> AuthenticatedUser:
    return AuthenticatedUser(
        id=uuid4(),
        email="test@example.com",
        name="Test User",
        role=role,
    )


def test_post_workout_rejects_non_admin() -> None:
    with pytest.raises(HTTPException) as exc:
        post_workout(  # type: ignore[arg-type]
            payload=WorkoutCreateRequest(
                name="Test Workout",
                type="strength",
                target_sets=3,
                target_reps=10,
                muscle_group_ids=[uuid4()],
            ),
            db=None,
            current_user=_sample_user(UserRole.COACH),
        )

    assert exc.value.status_code == 403


def test_post_muscle_group_rejects_non_admin() -> None:
    with pytest.raises(HTTPException) as exc:
        post_muscle_group(  # type: ignore[arg-type]
            payload=MuscleGroupCreateRequest(name="Custom", icon="custom"),
            db=None,
            current_user=_sample_user(UserRole.USER),
        )

    assert exc.value.status_code == 403


def test_post_plan_rejects_non_coach() -> None:
    with pytest.raises(HTTPException) as exc:
        post_plan(  # type: ignore[arg-type]
            payload=PlanCreateRequest(
                name="Test Plan",
                start_date="2026-02-10",
                end_date="2026-02-20",
                days=[{"day_of_week": 0, "workout_ids": [uuid4()]}],
            ),
            db=None,
            current_user=_sample_user(UserRole.ADMIN),
        )

    assert exc.value.status_code == 403
