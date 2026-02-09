"""Auth schema validation tests."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from models.enums import UserRole
from schemas.auth import LoginRequest, PasswordResetRequest, RegisterRequest


def test_register_request_rejects_non_user_role() -> None:
    with pytest.raises(ValidationError):
        RegisterRequest(
            name="Admin",
            email="admin@example.com",
            password="strong-password",
            role=UserRole.ADMIN,
        )


def test_login_request_normalizes_email() -> None:
    payload = LoginRequest(email="  USER@Example.COM ", password="strong-password")

    assert payload.email == "user@example.com"


def test_password_reset_rejects_relative_redirect() -> None:
    with pytest.raises(ValidationError):
        PasswordResetRequest(email="athlete@example.com", redirect_to="/auth/update-password")
