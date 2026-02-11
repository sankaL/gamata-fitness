"""Integration tests using urllib.request against a running API server."""

from __future__ import annotations

import json
import os
from urllib import error, request

import pytest


API_BASE_URL = os.getenv("GAMATA_API_BASE_URL", "http://127.0.0.1:8000")


def _call_api(path: str) -> tuple[int, str]:
    req = request.Request(f"{API_BASE_URL}{path}", method="GET")
    try:
        with request.urlopen(req, timeout=3) as response:  # noqa: S310
            return response.status, response.read().decode("utf-8")
    except error.HTTPError as exc:
        payload = exc.read().decode("utf-8")
        return exc.code, payload


@pytest.fixture(scope="module", autouse=True)
def ensure_api_is_available() -> None:
    try:
        status, _ = _call_api("/health")
        if status >= 500:
            pytest.skip(f"API returned status {status} for /health at {API_BASE_URL}")
    except error.URLError:
        pytest.skip(f"API is not running at {API_BASE_URL}")


def test_health_endpoint_returns_ok() -> None:
    status, payload = _call_api("/health")
    assert status == 200
    body = json.loads(payload)
    assert body["status"] == "ok"


def test_admin_users_endpoint_requires_authentication() -> None:
    status, payload = _call_api("/users")
    assert status in {401, 403}
    body = json.loads(payload)
    assert "detail" in body
