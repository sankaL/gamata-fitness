"""Workout schema validation tests."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from schemas.workouts import WorkoutCreateRequest, WorkoutUpdateRequest


def test_strength_workout_requires_sets_and_reps() -> None:
    payload = WorkoutCreateRequest(
        name="Bench Press",
        type="strength",
        target_sets=4,
        target_reps=8,
        muscle_group_ids=["10000000-0000-0000-0000-000000000001"],
    )

    assert payload.type == "strength"
    assert payload.target_sets == 4
    assert payload.target_reps == 8


def test_cardio_workout_requires_cardio_fields() -> None:
    with pytest.raises(ValidationError):
        WorkoutCreateRequest(
            name="Run",
            type="cardio",
            target_duration=20,
            muscle_group_ids=["10000000-0000-0000-0000-000000000007"],
        )


def test_workout_update_request_requires_at_least_one_field() -> None:
    with pytest.raises(ValidationError):
        WorkoutUpdateRequest()
