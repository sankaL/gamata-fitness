"""Authentication service logic."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import supabase_admin, supabase_anon
from models.enums import UserRole
from models.user import User
from schemas.auth import (
    AuthResponse,
    LoginRequest,
    MessageResponse,
    PasswordResetRequest,
    PasswordUpdateRequest,
    RegisterRequest,
    UserResponse,
)

logger = logging.getLogger(__name__)


@dataclass(slots=True)
class VerifiedToken:
    user_id: UUID
    email: str | None


class AuthServiceError(Exception):
    """Raised when an authentication flow fails with a client-safe message."""

    def __init__(self, detail: str, status_code: int) -> None:
        super().__init__(detail)
        self.detail = detail
        self.status_code = status_code


def _extract_auth_user(auth_result: Any) -> Any:
    user = getattr(auth_result, "user", None)
    if user is None:
        raise AuthServiceError("Authentication provider did not return a user.", 502)
    return user


def _extract_session_tokens(auth_result: Any) -> dict[str, str | int | None]:
    session = getattr(auth_result, "session", None)
    if session is None:
        return {
            "access_token": None,
            "refresh_token": None,
            "expires_in": None,
            "token_type": "bearer",
        }

    return {
        "access_token": getattr(session, "access_token", None),
        "refresh_token": getattr(session, "refresh_token", None),
        "expires_in": getattr(session, "expires_in", None),
        "token_type": getattr(session, "token_type", "bearer"),
    }


def _to_uuid(value: str) -> UUID:
    try:
        return UUID(value)
    except ValueError as exc:
        raise AuthServiceError("Authentication provider returned an invalid user ID.", 502) from exc


def _extract_auth_user_name(auth_user: Any, fallback: str) -> str:
    candidate_values = (
        getattr(auth_user, "email", None),
        getattr(auth_user, "phone", None),
    )
    metadata = getattr(auth_user, "user_metadata", None)
    if isinstance(metadata, dict):
        raw_name = metadata.get("name")
        if isinstance(raw_name, str) and raw_name.strip():
            return raw_name.strip()

    for candidate in candidate_values:
        if isinstance(candidate, str) and candidate.strip():
            return candidate.strip()

    return fallback


def _get_or_create_local_user(
    db: Session,
    auth_user: Any,
    preferred_name: str | None = None,
) -> User:
    auth_user_id = _to_uuid(str(getattr(auth_user, "id", "")))
    auth_email = str(getattr(auth_user, "email", "")).strip().lower()

    if not auth_email:
        raise AuthServiceError("Authentication provider returned an invalid email.", 502)

    user = db.scalar(select(User).where(User.id == auth_user_id))
    if user is not None:
        if not user.is_active:
            raise AuthServiceError("User account is deactivated.", 403)

        # Keep local profile in sync for name/email changes.
        user.email = auth_email
        if preferred_name:
            user.name = preferred_name
        db.commit()
        db.refresh(user)
        return user

    name = preferred_name or _extract_auth_user_name(auth_user, fallback=auth_email)

    user = User(
        id=auth_user_id,
        name=name,
        email=auth_email,
        role=UserRole.USER,
    )

    db.add(user)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        logger.exception("Failed to create local user profile for auth user %s", auth_user_id)
        raise AuthServiceError("A local profile with this email already exists.", 409) from exc

    db.refresh(user)
    return user


def serialize_user(user: User) -> UserResponse:
    return UserResponse.model_validate(user)


def verify_access_token(token: str) -> VerifiedToken:
    try:
        auth_response = supabase_anon.auth.get_user(token)
    except Exception as exc:  # noqa: BLE001
        logger.exception("Supabase token verification failed.")
        raise AuthServiceError("Invalid or expired access token.", 401) from exc

    auth_user = _extract_auth_user(auth_response)
    user_id = _to_uuid(str(getattr(auth_user, "id", "")))
    email = getattr(auth_user, "email", None)
    email_value = email.strip().lower() if isinstance(email, str) else None

    return VerifiedToken(user_id=user_id, email=email_value)


def register_user(db: Session, payload: RegisterRequest) -> AuthResponse:
    try:
        auth_result = supabase_anon.auth.sign_up(
            {
                "email": payload.email,
                "password": payload.password,
                "options": {"data": {"name": payload.name, "role": payload.role.value}},
            }
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("Supabase sign-up failed for %s", payload.email)
        raise AuthServiceError("Unable to complete registration.", 400) from exc

    auth_user = _extract_auth_user(auth_result)
    created_auth_user_id = _to_uuid(str(getattr(auth_user, "id", "")))

    try:
        user = _get_or_create_local_user(db, auth_user=auth_user, preferred_name=payload.name)
    except AuthServiceError as exc:
        # Keep Supabase auth clean when local profile write fails.
        try:
            supabase_admin.auth.admin.delete_user(str(created_auth_user_id))
        except Exception:  # noqa: BLE001
            logger.exception(
                "Failed to rollback auth user %s after local profile failure.", created_auth_user_id
            )
        raise exc
    except Exception as exc:  # noqa: BLE001
        db.rollback()
        logger.exception(
            "Unexpected local profile creation error for auth user %s", created_auth_user_id
        )
        try:
            supabase_admin.auth.admin.delete_user(str(created_auth_user_id))
        except Exception:  # noqa: BLE001
            logger.exception(
                "Failed to rollback auth user %s after unexpected local profile error.",
                created_auth_user_id,
            )
        raise AuthServiceError("Unable to create local user profile.", 500) from exc

    tokens = _extract_session_tokens(auth_result)
    return AuthResponse(
        user=serialize_user(user),
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
        expires_in=tokens["expires_in"],
        token_type=str(tokens["token_type"] or "bearer"),
        requires_email_confirmation=tokens["access_token"] is None,
    )


def login_user(db: Session, payload: LoginRequest) -> AuthResponse:
    try:
        auth_result = supabase_anon.auth.sign_in_with_password(
            {"email": payload.email, "password": payload.password}
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("Supabase sign-in failed for %s", payload.email)
        raise AuthServiceError("Invalid email or password.", 401) from exc

    auth_user = _extract_auth_user(auth_result)
    try:
        user = _get_or_create_local_user(db, auth_user=auth_user)
    except AuthServiceError:
        raise
    except Exception as exc:  # noqa: BLE001
        db.rollback()
        logger.exception("Unexpected local profile lookup/sync error during login.")
        raise AuthServiceError("Unable to load local user profile.", 500) from exc

    tokens = _extract_session_tokens(auth_result)

    if not tokens["access_token"]:
        raise AuthServiceError("Login did not return an access token.", 401)

    return AuthResponse(
        user=serialize_user(user),
        access_token=str(tokens["access_token"]),
        refresh_token=str(tokens["refresh_token"]) if tokens["refresh_token"] else None,
        expires_in=int(tokens["expires_in"]) if tokens["expires_in"] is not None else None,
        token_type=str(tokens["token_type"] or "bearer"),
        requires_email_confirmation=False,
    )


def get_user_profile(db: Session, user_id: UUID) -> User:
    user = db.scalar(select(User).where(User.id == user_id))
    if user is None:
        raise AuthServiceError("User profile not found.", 404)
    if not user.is_active:
        raise AuthServiceError("User account is deactivated.", 403)
    return user


def send_password_reset(payload: PasswordResetRequest) -> MessageResponse:
    options: dict[str, str] = {}
    if payload.redirect_to:
        options["redirect_to"] = payload.redirect_to

    try:
        supabase_anon.auth.reset_password_for_email(payload.email, options or None)
    except Exception as exc:  # noqa: BLE001
        logger.exception("Password reset request failed for %s", payload.email)
        raise AuthServiceError("Unable to send password reset email.", 400) from exc

    return MessageResponse(message="If the account exists, a password reset email has been sent.")


def update_password(access_token: str, payload: PasswordUpdateRequest) -> MessageResponse:
    try:
        verified = verify_access_token(access_token)
        supabase_admin.auth.admin.update_user_by_id(
            str(verified.user_id), {"password": payload.password}
        )
    except AuthServiceError:
        raise
    except Exception as exc:  # noqa: BLE001
        logger.exception("Password update failed.")
        raise AuthServiceError("Unable to update password with the provided token.", 400) from exc

    return MessageResponse(message="Password updated successfully.")
