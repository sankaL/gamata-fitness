"""Service logic for CSV export workflows."""

from __future__ import annotations

import csv
import io
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from models.plan import PlanDay, WorkoutPlan
from models.user import CoachUserAssignment, User
from models.workout import Workout
from schemas.import_export import CSVImportResponse
from services.import_export_base import ImportExportServiceError
from services.import_export_importers import import_users_csv, import_workouts_csv

__all__ = [
    "ImportExportServiceError",
    "export_users_csv",
    "export_workouts_csv",
    "export_plan_csv",
    "import_users_csv",
    "import_workouts_csv",
    "CSVImportResponse",
]


def _csv_content(data_rows: list[list[str]], headers: list[str]) -> str:
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(headers)
    writer.writerows(data_rows)
    return buffer.getvalue()


def export_users_csv(db: Session) -> str:
    users = db.scalars(select(User).order_by(User.created_at.asc())).all()
    coach_counts = db.execute(
        select(
            CoachUserAssignment.user_id,
            func.count(CoachUserAssignment.coach_id),
        ).group_by(CoachUserAssignment.user_id)
    ).all()
    coach_count_by_user = {str(row[0]): int(row[1]) for row in coach_counts}

    rows = [
        [
            str(user.id),
            user.name,
            user.email,
            user.role.value,
            str(user.is_active).lower(),
            user.deactivated_at.isoformat() if user.deactivated_at else "",
            user.created_at.isoformat(),
            user.updated_at.isoformat(),
            str(coach_count_by_user.get(str(user.id), 0)),
        ]
        for user in users
    ]
    return _csv_content(
        rows,
        [
            "id",
            "name",
            "email",
            "role",
            "is_active",
            "deactivated_at",
            "created_at",
            "updated_at",
            "coach_count",
        ],
    )


def export_workouts_csv(db: Session) -> str:
    workouts = (
        db.scalars(
            select(Workout)
            .options(
                selectinload(Workout.cardio_type),
                selectinload(Workout.muscle_groups),
            )
            .order_by(Workout.created_at.asc())
        )
        .unique()
        .all()
    )

    rows: list[list[str]] = []
    for workout in workouts:
        rows.append(
            [
                str(workout.id),
                workout.name,
                workout.type.value,
                str(workout.is_archived).lower(),
                workout.description or "",
                workout.instructions or "",
                workout.cardio_type.name if workout.cardio_type else "",
                str(workout.target_sets) if workout.target_sets is not None else "",
                str(workout.target_reps) if workout.target_reps is not None else "",
                str(workout.suggested_weight) if workout.suggested_weight is not None else "",
                str(workout.target_duration) if workout.target_duration is not None else "",
                workout.difficulty_level.value if workout.difficulty_level is not None else "",
                "|".join(sorted(group.name for group in workout.muscle_groups)),
                workout.created_at.isoformat(),
                workout.updated_at.isoformat(),
            ]
        )

    return _csv_content(
        rows,
        [
            "id",
            "name",
            "type",
            "is_archived",
            "description",
            "instructions",
            "cardio_type",
            "target_sets",
            "target_reps",
            "suggested_weight",
            "target_duration",
            "difficulty_level",
            "muscle_groups",
            "created_at",
            "updated_at",
        ],
    )


def export_plan_csv(db: Session, *, coach_id: UUID, plan_id: UUID) -> str:
    plan = db.scalar(
        select(WorkoutPlan)
        .where(WorkoutPlan.id == plan_id, WorkoutPlan.coach_id == coach_id)
        .options(selectinload(WorkoutPlan.days).selectinload(PlanDay.workouts))
    )
    if plan is None:
        raise ImportExportServiceError("Plan not found.", 404)

    rows: list[list[str]] = []
    ordered_days = sorted(plan.days, key=lambda day: day.day_of_week)
    for day in ordered_days:
        ordered_workouts = sorted(day.workouts, key=lambda workout: workout.name.lower())
        if not ordered_workouts:
            rows.append(
                [
                    str(plan.id),
                    plan.name,
                    str(day.day_of_week),
                    "",
                    "",
                    "",
                    plan.start_date.isoformat(),
                    plan.end_date.isoformat(),
                ]
            )
            continue

        for workout in ordered_workouts:
            rows.append(
                [
                    str(plan.id),
                    plan.name,
                    str(day.day_of_week),
                    str(workout.id),
                    workout.name,
                    workout.type.value,
                    plan.start_date.isoformat(),
                    plan.end_date.isoformat(),
                ]
            )

    return _csv_content(
        rows,
        [
            "plan_id",
            "plan_name",
            "day_of_week",
            "workout_id",
            "workout_name",
            "workout_type",
            "plan_start_date",
            "plan_end_date",
        ],
    )
