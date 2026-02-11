"""CSV import parsing and persistence helpers."""

from __future__ import annotations

import csv
import io
import logging
from decimal import Decimal, InvalidOperation
from re import compile as re_compile

from sqlalchemy import select
from sqlalchemy.orm import Session

from models.enums import CardioDifficultyLevel, UserRole, WorkoutType
from models.user import User
from models.workout import CardioType, MuscleGroup, Workout
from schemas.import_export import CSVImportErrorItem, CSVImportResponse
from schemas.users import MIN_PASSWORD_LENGTH, UserCreateRequest
from schemas.workouts import WorkoutCreateRequest
from services.import_export_base import ImportExportServiceError
from services.users import UserServiceError, create_user
from services.workouts import WorkoutServiceError, create_workout

logger = logging.getLogger(__name__)
EMAIL_PATTERN = re_compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
ALLOWED_USER_IMPORT_ROLES = {UserRole.ADMIN, UserRole.COACH, UserRole.USER}


def _normalized_headers(fieldnames: list[str] | None) -> list[str]:
    if not fieldnames:
        raise ImportExportServiceError("CSV file must include a header row.", 400)
    return [header.strip().lower() for header in fieldnames]


def _add_error(errors: list[CSVImportErrorItem], row_number: int, field: str, message: str) -> None:
    errors.append(CSVImportErrorItem(row_number=row_number, field=field, message=message))


def import_users_csv(db: Session, *, content: str) -> CSVImportResponse:
    reader = csv.DictReader(io.StringIO(content))
    header_map = _normalized_headers(reader.fieldnames)
    required_headers = {"name", "email", "role", "password"}
    if not required_headers.issubset(set(header_map)):
        missing = ", ".join(sorted(required_headers.difference(set(header_map))))
        raise ImportExportServiceError(f"CSV missing required columns: {missing}.", 400)

    existing_emails = {
        email.lower()
        for email in db.scalars(select(User.email)).all()
        if isinstance(email, str) and email.strip()
    }
    seen_emails: set[str] = set()
    errors: list[CSVImportErrorItem] = []
    imported_rows = 0

    for index, row in enumerate(reader, start=2):
        name = (row.get("name") or "").strip()
        email = (row.get("email") or "").strip().lower()
        role_value = (row.get("role") or "").strip().lower()
        password = row.get("password") or ""

        has_error = False
        if not name:
            _add_error(errors, index, "name", "Name is required.")
            has_error = True
        if not email:
            _add_error(errors, index, "email", "Email is required.")
            has_error = True
        elif not EMAIL_PATTERN.match(email):
            _add_error(errors, index, "email", "Invalid email format.")
            has_error = True
        elif email in seen_emails:
            _add_error(errors, index, "email", "Duplicate email in CSV.")
            has_error = True
        elif email in existing_emails:
            _add_error(errors, index, "email", "Email already exists.")
            has_error = True

        if role_value not in {role.value for role in ALLOWED_USER_IMPORT_ROLES}:
            _add_error(errors, index, "role", "Role must be admin, coach, or user.")
            has_error = True

        if len(password.strip()) < MIN_PASSWORD_LENGTH:
            _add_error(
                errors,
                index,
                "password",
                f"Password must be at least {MIN_PASSWORD_LENGTH} characters.",
            )
            has_error = True

        if has_error:
            continue

        seen_emails.add(email)

        try:
            payload = UserCreateRequest(
                name=name,
                email=email,
                role=UserRole(role_value),
                password=password.strip(),
            )
            create_user(db, payload)
            imported_rows += 1
            existing_emails.add(email)
        except (ValueError, UserServiceError) as exc:
            logger.exception("CSV user import failed for row %s (%s)", index, email)
            _add_error(errors, index, "row", str(exc))

    return CSVImportResponse(
        total_rows=max(reader.line_num - 1, 0),
        imported_rows=imported_rows,
        errors=errors,
    )


def _parse_positive_int(
    value: str,
    *,
    row_number: int,
    field: str,
) -> tuple[int | None, CSVImportErrorItem | None]:
    cleaned = value.strip()
    if not cleaned:
        return (
            None,
            CSVImportErrorItem(row_number=row_number, field=field, message="Value is required."),
        )
    try:
        parsed = int(cleaned)
    except ValueError:
        return (
            None,
            CSVImportErrorItem(
                row_number=row_number,
                field=field,
                message="Value must be an integer.",
            ),
        )
    if parsed <= 0:
        return (
            None,
            CSVImportErrorItem(
                row_number=row_number,
                field=field,
                message="Value must be greater than 0.",
            ),
        )
    return parsed, None


def import_workouts_csv(db: Session, *, content: str) -> CSVImportResponse:
    reader = csv.DictReader(io.StringIO(content))
    header_map = _normalized_headers(reader.fieldnames)
    required_headers = {"name", "type", "muscle_groups"}
    if not required_headers.issubset(set(header_map)):
        missing = ", ".join(sorted(required_headers.difference(set(header_map))))
        raise ImportExportServiceError(f"CSV missing required columns: {missing}.", 400)

    muscle_groups = db.scalars(select(MuscleGroup)).all()
    muscle_group_id_by_name = {group.name.lower(): group.id for group in muscle_groups}

    cardio_types = db.scalars(select(CardioType)).all()
    cardio_type_id_by_name = {item.name.lower(): item.id for item in cardio_types}

    existing_workout_names = {
        name.lower()
        for name in db.scalars(select(Workout.name)).all()
        if isinstance(name, str)
    }
    seen_workout_names: set[str] = set()
    errors: list[CSVImportErrorItem] = []
    imported_rows = 0

    for index, row in enumerate(reader, start=2):
        name = (row.get("name") or "").strip()
        workout_type_raw = (row.get("type") or "").strip().lower()
        description = (row.get("description") or "").strip() or None
        instructions = (row.get("instructions") or "").strip() or None
        muscle_group_names = [
            item.strip().lower()
            for item in (row.get("muscle_groups") or "").split("|")
            if item.strip()
        ]

        has_error = False
        if not name:
            _add_error(errors, index, "name", "Workout name is required.")
            has_error = True
        elif name.lower() in seen_workout_names:
            _add_error(errors, index, "name", "Duplicate workout name in CSV.")
            has_error = True
        elif name.lower() in existing_workout_names:
            _add_error(errors, index, "name", "Workout name already exists.")
            has_error = True

        if workout_type_raw not in {WorkoutType.STRENGTH.value, WorkoutType.CARDIO.value}:
            _add_error(errors, index, "type", "Workout type must be strength or cardio.")
            has_error = True

        if not muscle_group_names:
            _add_error(errors, index, "muscle_groups", "At least one muscle group is required.")
            has_error = True

        missing_groups = [group for group in muscle_group_names if group not in muscle_group_id_by_name]
        if missing_groups:
            _add_error(
                errors,
                index,
                "muscle_groups",
                f"Unknown muscle groups: {', '.join(sorted(set(missing_groups)))}.",
            )
            has_error = True

        if has_error:
            continue

        payload_data: dict[str, object] = {
            "name": name,
            "type": workout_type_raw,
            "description": description,
            "instructions": instructions,
            "muscle_group_ids": [
                muscle_group_id_by_name[group_name]
                for group_name in muscle_group_names
            ],
        }

        if workout_type_raw == WorkoutType.STRENGTH.value:
            target_sets, sets_error = _parse_positive_int(
                row.get("target_sets") or "",
                row_number=index,
                field="target_sets",
            )
            target_reps, reps_error = _parse_positive_int(
                row.get("target_reps") or "",
                row_number=index,
                field="target_reps",
            )
            if sets_error:
                errors.append(sets_error)
                continue
            if reps_error:
                errors.append(reps_error)
                continue

            payload_data["target_sets"] = target_sets
            payload_data["target_reps"] = target_reps

            suggested_weight_raw = (row.get("suggested_weight") or "").strip()
            if suggested_weight_raw:
                try:
                    payload_data["suggested_weight"] = Decimal(suggested_weight_raw)
                except InvalidOperation:
                    _add_error(
                        errors,
                        index,
                        "suggested_weight",
                        "Suggested weight must be numeric.",
                    )
                    continue
        else:
            cardio_type_name = (row.get("cardio_type") or "").strip().lower()
            if not cardio_type_name:
                _add_error(
                    errors,
                    index,
                    "cardio_type",
                    "Cardio type is required for cardio workouts.",
                )
                continue

            cardio_type_id = cardio_type_id_by_name.get(cardio_type_name)
            if cardio_type_id is None:
                _add_error(errors, index, "cardio_type", "Cardio type was not found.")
                continue

            target_duration, duration_error = _parse_positive_int(
                row.get("target_duration") or "",
                row_number=index,
                field="target_duration",
            )
            if duration_error:
                errors.append(duration_error)
                continue

            difficulty_level = (row.get("difficulty_level") or "").strip().lower()
            if difficulty_level not in {
                CardioDifficultyLevel.EASY.value,
                CardioDifficultyLevel.MEDIUM.value,
                CardioDifficultyLevel.HARD.value,
            }:
                _add_error(
                    errors,
                    index,
                    "difficulty_level",
                    "Difficulty must be easy, medium, or hard.",
                )
                continue

            payload_data["cardio_type_id"] = cardio_type_id
            payload_data["target_duration"] = target_duration
            payload_data["difficulty_level"] = difficulty_level

        try:
            payload = WorkoutCreateRequest(**payload_data)
            create_workout(db, payload)
            imported_rows += 1
            seen_workout_names.add(name.lower())
            existing_workout_names.add(name.lower())
        except (WorkoutServiceError, ValueError) as exc:
            logger.exception("CSV workout import failed for row %s (%s)", index, name)
            _add_error(errors, index, "row", str(exc))

    return CSVImportResponse(
        total_rows=max(reader.line_num - 1, 0),
        imported_rows=imported_rows,
        errors=errors,
    )
