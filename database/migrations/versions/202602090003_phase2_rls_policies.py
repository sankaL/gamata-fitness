"""Enable RLS and policies for Phase 2 tables."""

from __future__ import annotations

from pathlib import Path

from alembic import op

# revision identifiers, used by Alembic.
revision = "202602090003"
down_revision = "202602090002"
branch_labels = None
depends_on = None

PHASE2_TABLES = (
    "users",
    "coach_user_assignments",
    "muscle_groups",
    "cardio_types",
    "workouts",
    "workout_muscle_groups",
    "workout_plans",
    "plan_days",
    "plan_day_workouts",
    "plan_assignments",
    "workout_sessions",
    "exercise_logs",
)

POLICY_NAMES: tuple[tuple[str, str], ...] = (
    ("users", "users_select_access"),
    ("users", "users_insert_self_or_admin"),
    ("users", "users_update_self_or_admin"),
    ("users", "users_delete_admin_only"),
    ("coach_user_assignments", "cua_select_visibility"),
    ("coach_user_assignments", "cua_insert_admin_only"),
    ("coach_user_assignments", "cua_update_admin_only"),
    ("coach_user_assignments", "cua_delete_admin_only"),
    ("muscle_groups", "muscle_groups_select_authenticated"),
    ("muscle_groups", "muscle_groups_admin_write"),
    ("cardio_types", "cardio_types_select_authenticated"),
    ("cardio_types", "cardio_types_admin_write"),
    ("workouts", "workouts_select_authenticated"),
    ("workouts", "workouts_admin_write"),
    ("workout_muscle_groups", "workout_muscle_groups_select_authenticated"),
    ("workout_muscle_groups", "workout_muscle_groups_admin_write"),
    ("workout_plans", "workout_plans_select_scope"),
    ("workout_plans", "workout_plans_insert_scope"),
    ("workout_plans", "workout_plans_update_scope"),
    ("workout_plans", "workout_plans_delete_scope"),
    ("plan_days", "plan_days_select_scope"),
    ("plan_days", "plan_days_write_scope"),
    ("plan_day_workouts", "plan_day_workouts_select_scope"),
    ("plan_day_workouts", "plan_day_workouts_write_scope"),
    ("plan_assignments", "plan_assignments_select_scope"),
    ("plan_assignments", "plan_assignments_insert_scope"),
    ("plan_assignments", "plan_assignments_update_scope"),
    ("plan_assignments", "plan_assignments_delete_scope"),
    ("workout_sessions", "workout_sessions_select_scope"),
    ("workout_sessions", "workout_sessions_insert_scope"),
    ("workout_sessions", "workout_sessions_update_scope"),
    ("workout_sessions", "workout_sessions_delete_scope"),
    ("exercise_logs", "exercise_logs_select_scope"),
    ("exercise_logs", "exercise_logs_insert_scope"),
    ("exercise_logs", "exercise_logs_update_scope"),
    ("exercise_logs", "exercise_logs_delete_scope"),
)


def _upgrade_sql() -> str:
    sql_file = (
        Path(__file__).resolve().parents[1] / "sql" / "202602090003_phase2_rls_up.sql"
    )
    return sql_file.read_text(encoding="utf-8")


def upgrade() -> None:
    op.execute(_upgrade_sql())


def downgrade() -> None:
    for table_name, policy_name in reversed(POLICY_NAMES):
        op.execute(f"DROP POLICY IF EXISTS {policy_name} ON {table_name}")

    for table_name in PHASE2_TABLES:
        op.execute(f"ALTER TABLE {table_name} DISABLE ROW LEVEL SECURITY")

    op.execute("DROP FUNCTION IF EXISTS public.can_access_user(uuid, uuid)")
    op.execute("DROP FUNCTION IF EXISTS public.is_coach_of(uuid, uuid)")
    op.execute("DROP FUNCTION IF EXISTS public.is_admin(uuid)")
    op.execute("DROP FUNCTION IF EXISTS public.current_user_role(uuid)")
