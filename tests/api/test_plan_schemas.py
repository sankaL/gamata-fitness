"""Plan schema validation tests."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from schemas.plans import PlanAssignRequest, PlanCreateRequest, PlanUpdateRequest


def test_plan_create_rejects_duplicate_days() -> None:
    with pytest.raises(ValidationError):
        PlanCreateRequest(
            name="Strength Week",
            start_date="2026-02-10",
            end_date="2026-02-20",
            days=[
                {
                    "day_of_week": 0,
                    "workout_ids": ["30000000-0000-0000-0000-000000000001"],
                },
                {
                    "day_of_week": 0,
                    "workout_ids": ["30000000-0000-0000-0000-000000000002"],
                },
            ],
        )


def test_plan_update_requires_field() -> None:
    with pytest.raises(ValidationError):
        PlanUpdateRequest()


def test_plan_assign_request_requires_user_ids() -> None:
    with pytest.raises(ValidationError):
        PlanAssignRequest(user_ids=[])
