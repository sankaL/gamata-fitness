"""RBAC permission helper tests."""

from __future__ import annotations

import asyncio
from uuid import uuid4

import pytest
from fastapi import HTTPException

from core.permissions import AuthenticatedUser, _extract_bearer_token, require_role
from models.enums import UserRole


def _sample_user(role: UserRole) -> AuthenticatedUser:
    return AuthenticatedUser(
        id=uuid4(),
        email="tester@example.com",
        name="Test User",
        role=role,
    )


def test_extract_bearer_token_parses_case_insensitive_scheme() -> None:
    assert _extract_bearer_token("Bearer abc123") == "abc123"
    assert _extract_bearer_token("bearer xyz") == "xyz"


def test_extract_bearer_token_rejects_invalid_headers() -> None:
    assert _extract_bearer_token(None) is None
    assert _extract_bearer_token("Token abc123") is None
    assert _extract_bearer_token("Bearer    ") is None


def test_require_role_allows_matching_user() -> None:
    @require_role(["admin", "coach"])
    async def protected_endpoint(*, current_user: AuthenticatedUser) -> str:
        return "ok"

    result = asyncio.run(protected_endpoint(current_user=_sample_user(UserRole.ADMIN)))

    assert result == "ok"


def test_require_role_blocks_non_matching_user() -> None:
    @require_role(["admin"])
    async def protected_endpoint(*, current_user: AuthenticatedUser) -> str:
        return "ok"

    with pytest.raises(HTTPException) as exc:
        asyncio.run(protected_endpoint(current_user=_sample_user(UserRole.USER)))

    assert exc.value.status_code == 403


def test_require_role_requires_current_user_dependency() -> None:
    @require_role(["admin"])
    async def protected_endpoint(*, current_user: AuthenticatedUser) -> str:
        return "ok"

    with pytest.raises(HTTPException) as exc:
        asyncio.run(protected_endpoint())

    assert exc.value.status_code == 500
