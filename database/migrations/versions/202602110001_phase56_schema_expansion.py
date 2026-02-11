"""Expand workout targets and plan archival columns for Phases 5 and 6."""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "202602110001"
down_revision = "202602090004"
branch_labels = None
depends_on = None

cardio_difficulty_level_enum = postgresql.ENUM(
    "easy",
    "medium",
    "hard",
    name="cardio_difficulty_level",
    create_type=False,
)


def upgrade() -> None:
    bind = op.get_bind()
    cardio_difficulty_level_enum.create(bind, checkfirst=True)

    op.add_column("workouts", sa.Column("target_sets", sa.SmallInteger(), nullable=True))
    op.add_column("workouts", sa.Column("target_reps", sa.SmallInteger(), nullable=True))
    op.add_column("workouts", sa.Column("suggested_weight", sa.Numeric(8, 2), nullable=True))
    op.add_column("workouts", sa.Column("target_duration", sa.Integer(), nullable=True))
    op.add_column(
        "workouts",
        sa.Column("difficulty_level", cardio_difficulty_level_enum, nullable=True),
    )

    op.add_column(
        "workout_plans",
        sa.Column(
            "is_archived",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )
    op.add_column(
        "workout_plans",
        sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(
        "ix_workout_plans_is_archived",
        "workout_plans",
        ["is_archived"],
        unique=False,
    )

    op.execute(
        """
        UPDATE workouts
        SET
            target_sets = COALESCE(target_sets, 3),
            target_reps = COALESCE(target_reps, 10)
        WHERE type = 'strength'::workout_type
        """
    )
    op.execute(
        """
        UPDATE workouts
        SET
            target_duration = COALESCE(target_duration, 20),
            difficulty_level = COALESCE(difficulty_level, 'medium'::cardio_difficulty_level)
        WHERE type = 'cardio'::workout_type
        """
    )

    op.create_check_constraint(
        "ck_workouts_target_sets_positive",
        "workouts",
        "target_sets IS NULL OR target_sets > 0",
    )
    op.create_check_constraint(
        "ck_workouts_target_reps_positive",
        "workouts",
        "target_reps IS NULL OR target_reps > 0",
    )
    op.create_check_constraint(
        "ck_workouts_suggested_weight_non_negative",
        "workouts",
        "suggested_weight IS NULL OR suggested_weight >= 0",
    )
    op.create_check_constraint(
        "ck_workouts_target_duration_positive",
        "workouts",
        "target_duration IS NULL OR target_duration > 0",
    )
    op.create_check_constraint(
        "ck_workouts_strength_fields",
        "workouts",
        """
        (type <> 'strength'::workout_type)
        OR (
            target_sets IS NOT NULL
            AND target_reps IS NOT NULL
            AND cardio_type_id IS NULL
            AND target_duration IS NULL
            AND difficulty_level IS NULL
        )
        """,
    )
    op.create_check_constraint(
        "ck_workouts_cardio_fields",
        "workouts",
        """
        (type <> 'cardio'::workout_type)
        OR (
            cardio_type_id IS NOT NULL
            AND target_duration IS NOT NULL
            AND difficulty_level IS NOT NULL
            AND target_sets IS NULL
            AND target_reps IS NULL
            AND suggested_weight IS NULL
        )
        """,
    )


def downgrade() -> None:
    op.drop_constraint("ck_workouts_cardio_fields", "workouts", type_="check")
    op.drop_constraint("ck_workouts_strength_fields", "workouts", type_="check")
    op.drop_constraint("ck_workouts_target_duration_positive", "workouts", type_="check")
    op.drop_constraint("ck_workouts_suggested_weight_non_negative", "workouts", type_="check")
    op.drop_constraint("ck_workouts_target_reps_positive", "workouts", type_="check")
    op.drop_constraint("ck_workouts_target_sets_positive", "workouts", type_="check")

    op.drop_index("ix_workout_plans_is_archived", table_name="workout_plans")

    op.drop_column("workout_plans", "archived_at")
    op.drop_column("workout_plans", "is_archived")

    op.drop_column("workouts", "difficulty_level")
    op.drop_column("workouts", "target_duration")
    op.drop_column("workouts", "suggested_weight")
    op.drop_column("workouts", "target_reps")
    op.drop_column("workouts", "target_sets")

    cardio_difficulty_level_enum.drop(op.get_bind(), checkfirst=True)
