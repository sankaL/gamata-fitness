"""Create Phase 2 core schema tables and constraints."""

from __future__ import annotations

from pathlib import Path

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "202602090001"
down_revision = None
branch_labels = None
depends_on = None

user_role_enum = postgresql.ENUM(
    "admin", "coach", "user", name="user_role", create_type=False
)
workout_type_enum = postgresql.ENUM(
    "strength", "cardio", name="workout_type", create_type=False
)
plan_assignment_status_enum = postgresql.ENUM(
    "pending", "active", "inactive", name="plan_assignment_status", create_type=False
)
session_type_enum = postgresql.ENUM(
    "assigned", "swap", "adhoc", name="session_type", create_type=False
)


def _post_create_sql() -> str:
    sql_file = (
        Path(__file__).resolve().parents[1]
        / "sql"
        / "202602090001_phase2_post_create.sql"
    )
    return sql_file.read_text(encoding="utf-8")


def upgrade() -> None:
    bind = op.get_bind()

    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")

    user_role_enum.create(bind, checkfirst=True)
    workout_type_enum.create(bind, checkfirst=True)
    plan_assignment_status_enum.create(bind, checkfirst=True)
    session_type_enum.create(bind, checkfirst=True)

    op.create_table(
        "users",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column(
            "role",
            user_role_enum,
            nullable=False,
            server_default=sa.text("'user'::user_role"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email", name="uq_users_email"),
    )

    op.create_table(
        "coach_user_assignments",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("coach_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("assigned_by", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "assigned_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.CheckConstraint(
            "coach_id <> user_id", name="ck_coach_user_assignments_distinct"
        ),
        sa.ForeignKeyConstraint(["assigned_by"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["coach_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "coach_id", "user_id", name="uq_coach_user_assignments_coach_user"
        ),
    )

    op.create_table(
        "muscle_groups",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("icon", sa.String(length=120), nullable=False),
        sa.Column(
            "is_default", sa.Boolean(), nullable=False, server_default=sa.text("true")
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name", name="uq_muscle_groups_name"),
    )

    op.create_table(
        "cardio_types",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name", name="uq_cardio_types_name"),
    )

    op.create_table(
        "workouts",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("instructions", sa.Text(), nullable=True),
        sa.Column("type", workout_type_enum, nullable=False),
        sa.Column("cardio_type_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column(
            "is_archived", sa.Boolean(), nullable=False, server_default=sa.text("false")
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(
            ["cardio_type_id"], ["cardio_types.id"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name", name="uq_workouts_name"),
    )

    op.create_table(
        "workout_muscle_groups",
        sa.Column("workout_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("muscle_group_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["muscle_group_id"], ["muscle_groups.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["workout_id"], ["workouts.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("workout_id", "muscle_group_id"),
    )

    op.create_table(
        "workout_plans",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("name", sa.String(length=180), nullable=False),
        sa.Column("coach_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.CheckConstraint(
            "start_date <= end_date", name="ck_workout_plans_date_range"
        ),
        sa.ForeignKeyConstraint(["coach_id"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "plan_days",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("plan_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("day_of_week", sa.SmallInteger(), nullable=False),
        sa.CheckConstraint(
            "day_of_week >= 0 AND day_of_week <= 6", name="ck_plan_days_day_of_week"
        ),
        sa.ForeignKeyConstraint(["plan_id"], ["workout_plans.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("plan_id", "day_of_week", name="uq_plan_days_plan_day"),
    )

    op.create_table(
        "plan_day_workouts",
        sa.Column("plan_day_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("workout_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(["plan_day_id"], ["plan_days.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["workout_id"], ["workouts.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("plan_day_id", "workout_id"),
    )

    op.create_table(
        "plan_assignments",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("plan_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "status",
            plan_assignment_status_enum,
            nullable=False,
            server_default=sa.text("'pending'::plan_assignment_status"),
        ),
        sa.Column(
            "assigned_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column("activated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deactivated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["plan_id"], ["workout_plans.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "workout_sessions",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("workout_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("plan_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column(
            "session_type",
            session_type_enum,
            nullable=False,
            server_default=sa.text("'assigned'::session_type"),
        ),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(["plan_id"], ["workout_plans.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["workout_id"], ["workouts.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "exercise_logs",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("sets", sa.Integer(), nullable=True),
        sa.Column("reps", sa.Integer(), nullable=True),
        sa.Column("weight", sa.Numeric(8, 2), nullable=True),
        sa.Column("duration", sa.Integer(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "logged_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.CheckConstraint(
            '"sets" IS NULL OR "sets" >= 0', name="ck_exercise_logs_sets_non_negative"
        ),
        sa.CheckConstraint(
            "reps IS NULL OR reps >= 0", name="ck_exercise_logs_reps_non_negative"
        ),
        sa.CheckConstraint(
            "weight IS NULL OR weight >= 0", name="ck_exercise_logs_weight_non_negative"
        ),
        sa.CheckConstraint(
            "duration IS NULL OR duration >= 0",
            name="ck_exercise_logs_duration_non_negative",
        ),
        sa.ForeignKeyConstraint(
            ["session_id"], ["workout_sessions.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_coach_user_assignments_coach_id",
        "coach_user_assignments",
        ["coach_id"],
        unique=False,
    )
    op.create_index(
        "ix_coach_user_assignments_user_id",
        "coach_user_assignments",
        ["user_id"],
        unique=False,
    )
    op.create_index("ix_workouts_type", "workouts", ["type"], unique=False)
    op.create_index(
        "ix_workouts_is_archived", "workouts", ["is_archived"], unique=False
    )
    op.create_index(
        "ix_workout_plans_coach_id", "workout_plans", ["coach_id"], unique=False
    )
    op.create_index("ix_plan_days_plan_id", "plan_days", ["plan_id"], unique=False)
    op.create_index(
        "ix_plan_assignments_plan_id", "plan_assignments", ["plan_id"], unique=False
    )
    op.create_index(
        "ix_plan_assignments_user_id", "plan_assignments", ["user_id"], unique=False
    )
    op.create_index(
        "ix_plan_assignments_status", "plan_assignments", ["status"], unique=False
    )
    op.create_index(
        "ix_workout_sessions_user_id", "workout_sessions", ["user_id"], unique=False
    )
    op.create_index(
        "ix_workout_sessions_workout_id",
        "workout_sessions",
        ["workout_id"],
        unique=False,
    )
    op.create_index(
        "ix_workout_sessions_plan_id", "workout_sessions", ["plan_id"], unique=False
    )
    op.create_index(
        "ix_workout_sessions_user_completed_at",
        "workout_sessions",
        ["user_id", "completed_at"],
        unique=False,
    )
    op.create_index(
        "ix_exercise_logs_session_id", "exercise_logs", ["session_id"], unique=False
    )
    op.create_index(
        "ix_exercise_logs_session_logged_at",
        "exercise_logs",
        ["session_id", "logged_at"],
        unique=False,
    )
    op.execute(_post_create_sql())


def downgrade() -> None:
    op.execute(
        "DROP TRIGGER IF EXISTS trg_coach_assignment_rules ON coach_user_assignments"
    )
    op.execute("DROP FUNCTION IF EXISTS public.enforce_coach_assignment_rules()")

    for table_name in (
        "users",
        "workouts",
        "workout_plans",
        "workout_sessions",
        "exercise_logs",
    ):
        op.execute(
            f"DROP TRIGGER IF EXISTS trg_{table_name}_set_updated_at ON {table_name}"
        )

    op.execute("DROP FUNCTION IF EXISTS public.set_updated_at()")

    op.execute("DROP INDEX IF EXISTS uq_plan_assignments_user_active")
    op.drop_index("ix_exercise_logs_session_logged_at", table_name="exercise_logs")
    op.drop_index("ix_exercise_logs_session_id", table_name="exercise_logs")
    op.drop_index(
        "ix_workout_sessions_user_completed_at", table_name="workout_sessions"
    )
    op.drop_index("ix_workout_sessions_plan_id", table_name="workout_sessions")
    op.drop_index("ix_workout_sessions_workout_id", table_name="workout_sessions")
    op.drop_index("ix_workout_sessions_user_id", table_name="workout_sessions")
    op.drop_index("ix_plan_assignments_status", table_name="plan_assignments")
    op.drop_index("ix_plan_assignments_user_id", table_name="plan_assignments")
    op.drop_index("ix_plan_assignments_plan_id", table_name="plan_assignments")
    op.drop_index("ix_plan_days_plan_id", table_name="plan_days")
    op.drop_index("ix_workout_plans_coach_id", table_name="workout_plans")
    op.drop_index("ix_workouts_is_archived", table_name="workouts")
    op.drop_index("ix_workouts_type", table_name="workouts")
    op.drop_index(
        "ix_coach_user_assignments_user_id", table_name="coach_user_assignments"
    )
    op.drop_index(
        "ix_coach_user_assignments_coach_id", table_name="coach_user_assignments"
    )

    op.drop_table("exercise_logs")
    op.drop_table("workout_sessions")
    op.drop_table("plan_assignments")
    op.drop_table("plan_day_workouts")
    op.drop_table("plan_days")
    op.drop_table("workout_plans")
    op.drop_table("workout_muscle_groups")
    op.drop_table("workouts")
    op.drop_table("cardio_types")
    op.drop_table("muscle_groups")
    op.drop_table("coach_user_assignments")
    op.drop_table("users")

    session_type_enum.drop(op.get_bind(), checkfirst=True)
    plan_assignment_status_enum.drop(op.get_bind(), checkfirst=True)
    workout_type_enum.drop(op.get_bind(), checkfirst=True)
    user_role_enum.drop(op.get_bind(), checkfirst=True)
