"""Regression tests for optional rate-limit dependency loading."""

from __future__ import annotations

import pytest
from fastapi import FastAPI

from app.main import _configure_rate_limit


def test_rate_limit_missing_dependency_is_ignored_when_disabled(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def _raise_missing_dependency() -> tuple[object, object, object, object, object]:
        raise ModuleNotFoundError("No module named 'slowapi'")

    monkeypatch.setattr("app.main._load_rate_limit_dependencies", _raise_missing_dependency)

    app = FastAPI(title="test")
    _configure_rate_limit(app, enabled=False, api_rate_limit="120/minute")


def test_rate_limit_missing_dependency_raises_clear_error_when_enabled(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def _raise_missing_dependency() -> tuple[object, object, object, object, object]:
        raise ModuleNotFoundError("No module named 'slowapi'")

    monkeypatch.setattr("app.main._load_rate_limit_dependencies", _raise_missing_dependency)

    app = FastAPI(title="test")
    with pytest.raises(RuntimeError, match="Rate limiting is enabled but 'slowapi' is not installed."):
        _configure_rate_limit(app, enabled=True, api_rate_limit="120/minute")
