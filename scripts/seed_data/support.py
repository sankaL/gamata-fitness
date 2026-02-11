"""Shared helper routines for seed operations."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any
from uuid import UUID

from .config import SeedScriptError


def extract_attr(data: Any, name: str) -> Any:
    if isinstance(data, dict):
        return data.get(name)
    return getattr(data, name, None)


def extract_auth_user_id(auth_result: Any) -> UUID:
    auth_user = extract_attr(auth_result, "user")
    if auth_user is None:
        raise SeedScriptError("Auth provider response did not contain a user object.")
    raw = extract_attr(auth_user, "id")
    if raw is None:
        raise SeedScriptError("Auth provider response did not contain a user id.")
    try:
        return UUID(str(raw))
    except ValueError as exc:
        raise SeedScriptError(f"Invalid auth user id returned: {raw}") from exc


def find_auth_user_by_email(supabase_admin: Any, email: str) -> Any | None:
    for page in range(1, 11):
        response = supabase_admin.auth.admin.list_users(page=page, per_page=200)
        users = extract_attr(response, "users")
        if not users:
            break
        for user in users:
            user_email = extract_attr(user, "email")
            if isinstance(user_email, str) and user_email.lower() == email.lower():
                return user
    return None


def sync_auth_user_password(
    supabase_admin: Any,
    *,
    auth_user_id: UUID,
    email: str,
    name: str,
    role_value: str,
    password: str,
) -> None:
    try:
        supabase_admin.auth.admin.update_user_by_id(
            str(auth_user_id),
            {
                "email": email,
                "password": password,
                "email_confirm": True,
                "user_metadata": {"name": name, "role": role_value},
            },
        )
    except Exception as exc:  # noqa: BLE001
        raise SeedScriptError(
            f"Failed syncing auth credentials for {email} ({auth_user_id})."
        ) from exc


def write_payload(output_path: Path, payload: dict[str, Any]) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def assert_schema_compatible(db) -> None:
    from sqlalchemy import inspect

    inspector = inspect(db.bind)
    users_columns = {column["name"] for column in inspector.get_columns("users")}
    workouts_columns = {column["name"] for column in inspector.get_columns("workouts")}
    plans_columns = {column["name"] for column in inspector.get_columns("workout_plans")}
    missing = []
    if "is_active" not in users_columns:
        missing.append("users.is_active")
    if "target_sets" not in workouts_columns:
        missing.append("workouts.target_sets")
    if "is_archived" not in plans_columns:
        missing.append("workout_plans.is_archived")
    if missing:
        raise SeedScriptError(
            "Database schema is out of date. Missing required columns: "
            + ", ".join(missing)
            + ". Run migrations (`alembic upgrade head` or profile reset) and retry."
        )
