"""User management schema validation tests."""

from __future__ import annotations

import pytest
from pydantic import ValidationError
from schemas.users import UserCreateRequest, UserListQuery, UserUpdateRequest


def test_user_create_request_normalizes_email() -> None:
    payload = UserCreateRequest(
        name="Coach One",
        email="  Coach@Example.COM ",
        role="coach",
        password="strong-password",
    )

    assert payload.email == "coach@example.com"


def test_user_update_request_rejects_blank_name() -> None:
    with pytest.raises(ValidationError):
        UserUpdateRequest(name="   ")


def test_user_list_query_trims_empty_search() -> None:
    payload = UserListQuery(search="   ")

    assert payload.search is None
