"""Route-level RBAC tests for Phase 7, 8, and 9 endpoints."""

from __future__ import annotations

from uuid import uuid4

import pytest
from fastapi import HTTPException

from api.progress import get_frequency_trends, get_my_sessions
from api.sessions import post_session
from api.user_dashboard import get_today_workout
from core.permissions import AuthenticatedUser
from models.enums import UserRole
from schemas.progress import FrequencyProgressQuery, UserSessionHistoryQuery
from schemas.sessions import SessionCreateRequest


def _sample_user(role: UserRole) -> AuthenticatedUser:
    return AuthenticatedUser(
        id=uuid4(),
        email="test@example.com",
        name="Test User",
        role=role,
    )


def test_get_today_workout_rejects_non_user_role() -> None:
    with pytest.raises(HTTPException) as exc:
        get_today_workout(  # type: ignore[arg-type]
            db=None,
            current_user=_sample_user(UserRole.COACH),
        )

    assert exc.value.status_code == 403


def test_post_session_rejects_non_user_role() -> None:
    with pytest.raises(HTTPException) as exc:
        post_session(  # type: ignore[arg-type]
            payload=SessionCreateRequest(
                workout_id=uuid4(),
                plan_id=uuid4(),
                session_type="assigned",
            ),
            db=None,
            current_user=_sample_user(UserRole.ADMIN),
        )

    assert exc.value.status_code == 403


def test_get_my_sessions_rejects_non_user_role() -> None:
    with pytest.raises(HTTPException) as exc:
        get_my_sessions(  # type: ignore[arg-type]
            query=UserSessionHistoryQuery(page=1, page_size=10),
            db=None,
            current_user=_sample_user(UserRole.ADMIN),
        )

    assert exc.value.status_code == 403


def test_get_frequency_trends_rejects_non_user_role() -> None:
    with pytest.raises(HTTPException) as exc:
        get_frequency_trends(  # type: ignore[arg-type]
            query=FrequencyProgressQuery(period="weekly"),
            db=None,
            current_user=_sample_user(UserRole.COACH),
        )

    assert exc.value.status_code == 403
