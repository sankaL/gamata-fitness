"""Shared helpers for user management services."""

from __future__ import annotations

import logging
from typing import Any
from uuid import UUID

from app.database import supabase_admin
from models.enums import UserRole
from models.user import User
from schemas.users import CoachSummaryResponse, UserResponse

logger = logging.getLogger(__name__)


class UserServiceError(Exception):
    """Raised for client-safe user management failures."""

    def __init__(self, detail: str, status_code: int) -> None:
        super().__init__(detail)
        self.detail = detail
        self.status_code = status_code


def to_uuid(value: str) -> UUID:
    try:
        return UUID(value)
    except ValueError as exc:
        raise UserServiceError("Identity provider returned an invalid user ID.", 502) from exc


def extract_auth_user_id(auth_result: Any) -> UUID:
    user = getattr(auth_result, "user", None)
    if user is None:
        raise UserServiceError("Identity provider did not return a user.", 502)
    return to_uuid(str(getattr(user, "id", "")))


def to_user_response(user: User) -> UserResponse:
    return UserResponse.model_validate(user)


def to_coach_summary(coach: User) -> CoachSummaryResponse:
    return CoachSummaryResponse.model_validate(coach)


def sync_supabase_user(
    user_id: UUID,
    *,
    email: str | None = None,
    name: str | None = None,
    role: UserRole | None = None,
) -> None:
    update_payload: dict[str, Any] = {}
    if email is not None:
        update_payload["email"] = email
        update_payload["email_confirm"] = True
    if name is not None or role is not None:
        metadata: dict[str, str] = {}
        if name is not None:
            metadata["name"] = name
        if role is not None:
            metadata["role"] = role.value
        update_payload["user_metadata"] = metadata

    if not update_payload:
        return

    try:
        supabase_admin.auth.admin.update_user_by_id(str(user_id), update_payload)
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed syncing Supabase user %s", user_id)
        raise UserServiceError("Unable to sync user with authentication provider.", 502) from exc
