"""Route-level RBAC tests for Phase 10 and 11 endpoints."""

from __future__ import annotations

import asyncio
from io import BytesIO
from uuid import uuid4

import pytest
from fastapi import HTTPException, UploadFile

from api.import_export import get_plan_export, get_users_export, post_users_import
from api.plan_activation import get_pending_plans, post_activate_pending_plan
from core.permissions import AuthenticatedUser
from models.enums import UserRole


def _sample_user(role: UserRole) -> AuthenticatedUser:
    return AuthenticatedUser(
        id=uuid4(),
        email="test@example.com",
        name="Test User",
        role=role,
    )


def test_get_pending_plans_rejects_non_user_role() -> None:
    with pytest.raises(HTTPException) as exc:
        get_pending_plans(  # type: ignore[arg-type]
            db=None,
            current_user=_sample_user(UserRole.COACH),
        )

    assert exc.value.status_code == 403


def test_activate_pending_plan_rejects_non_user_role() -> None:
    with pytest.raises(HTTPException) as exc:
        post_activate_pending_plan(  # type: ignore[arg-type]
            assignment_id=uuid4(),
            db=None,
            current_user=_sample_user(UserRole.ADMIN),
        )

    assert exc.value.status_code == 403


def test_get_users_export_rejects_non_admin_role() -> None:
    with pytest.raises(HTTPException) as exc:
        get_users_export(  # type: ignore[arg-type]
            db=None,
            current_user=_sample_user(UserRole.COACH),
        )

    assert exc.value.status_code == 403


def test_get_plan_export_rejects_non_coach_role() -> None:
    with pytest.raises(HTTPException) as exc:
        get_plan_export(  # type: ignore[arg-type]
            plan_id=uuid4(),
            db=None,
            current_user=_sample_user(UserRole.USER),
        )

    assert exc.value.status_code == 403


def test_post_users_import_rejects_non_admin_role() -> None:
    upload = UploadFile(filename="users.csv", file=BytesIO(b"name,email,role,password\n"))
    with pytest.raises(HTTPException) as exc:
        asyncio.run(
            post_users_import(  # type: ignore[arg-type]
                file=upload,
                db=None,
                current_user=_sample_user(UserRole.USER),
            )
        )

    assert exc.value.status_code == 403
