"""Configuration, argument parsing, and static seed specs."""

from __future__ import annotations

import argparse
import os
from dataclasses import dataclass
from decimal import Decimal
from pathlib import Path
from uuid import UUID, uuid5


ROOT_DIR = Path(__file__).resolve().parents[2]
BACKEND_DIR = ROOT_DIR / "backend"
DEFAULT_ENV_PRIMARY = BACKEND_DIR / ".env.local-profile"
DEFAULT_ENV_FALLBACK = ROOT_DIR / ".env"
DEFAULT_OUTPUT_PATH = ROOT_DIR / "tmp" / "seeded_credentials.json"
DEFAULT_SHARED_PASSWORD = "GamataSeed!123"
SEED_NAMESPACE = UUID("1e8b05bb-7b5f-4f0c-b31e-6b8f6f0e4a79")


class SeedScriptError(Exception):
    """Raised for explicit script failures with user-facing messages."""


@dataclass(frozen=True)
class AccountSpec:
    role: str
    name: str
    email: str


@dataclass(frozen=True)
class WorkoutSpec:
    name: str
    workout_type: str
    muscle_groups: tuple[str, ...]
    description: str
    instructions: str
    target_sets: int | None = None
    target_reps: int | None = None
    suggested_weight: Decimal | None = None
    cardio_type_name: str | None = None
    target_duration: int | None = None
    difficulty_level: str | None = None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Seed deterministic QA data for GamataFitness."
    )
    parser.add_argument(
        "--env-file",
        default=None,
        help=(
            "Path to env file. Default resolves to "
            "'backend/.env.local-profile', then falls back to '.env'."
        ),
    )
    parser.add_argument(
        "--output",
        default=str(DEFAULT_OUTPUT_PATH),
        help="Path to credentials JSON output.",
    )
    parser.add_argument(
        "--shared-password",
        default=DEFAULT_SHARED_PASSWORD,
        help="Password set for all seeded accounts.",
    )
    parser.add_argument("--coaches", type=int, default=3, help="Number of seeded coaches.")
    parser.add_argument("--users", type=int, default=10, help="Number of seeded users.")
    parser.add_argument("--seed-tag", default="seed-v1", help="Deterministic seed dataset tag.")
    return parser.parse_args()


def resolve_env_file(env_file_arg: str | None) -> Path:
    if env_file_arg:
        explicit = Path(env_file_arg).expanduser().resolve()
        if not explicit.exists():
            raise SeedScriptError(f"Configured env file does not exist: {explicit}")
        return explicit

    if DEFAULT_ENV_PRIMARY.exists():
        return DEFAULT_ENV_PRIMARY
    if DEFAULT_ENV_FALLBACK.exists():
        return DEFAULT_ENV_FALLBACK
    raise SeedScriptError(
        "No env file found. Expected backend/.env.local-profile or root .env."
    )


def _strip_matching_quotes(value: str) -> str:
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
        return value[1:-1]
    return value


def load_env_file(env_path: Path) -> None:
    try:
        raw = env_path.read_text(encoding="utf-8")
    except OSError as exc:
        raise SeedScriptError(f"Unable to read env file {env_path}: {exc}") from exc

    for line in raw.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, value = stripped.split("=", 1)
        os.environ[key.strip()] = _strip_matching_quotes(value.strip())


def normalize_local_profile_hosts() -> None:
    for key in ("SUPABASE_URL", "DATABASE_URL"):
        value = os.getenv(key)
        if value:
            os.environ[key] = value.replace("host.docker.internal", "127.0.0.1")


def ensure_required_env() -> None:
    required = (
        "DATABASE_URL",
        "SUPABASE_URL",
        "SUPABASE_ANON_KEY",
        "SUPABASE_SERVICE_ROLE_KEY",
        "CORS_ALLOWED_ORIGINS",
    )
    missing = [key for key in required if not os.getenv(key, "").strip()]
    if missing:
        raise SeedScriptError(f"Missing required env vars: {', '.join(missing)}")


def seed_uuid(seed_tag: str, *parts: str) -> UUID:
    return uuid5(SEED_NAMESPACE, "|".join((seed_tag, *parts)))


def build_account_specs(
    coach_count: int, user_count: int
) -> tuple[AccountSpec, list[AccountSpec], list[AccountSpec]]:
    if coach_count < 1:
        raise SeedScriptError("--coaches must be at least 1.")
    if user_count < 1:
        raise SeedScriptError("--users must be at least 1.")

    admin = AccountSpec(role="admin", name="Seed Admin", email="admin.seed@gamata.test")
    coaches = [
        AccountSpec(
            role="coach",
            name=f"Seed Coach {index}",
            email=f"coach{index}.seed@gamata.test",
        )
        for index in range(1, coach_count + 1)
    ]
    users = [
        AccountSpec(
            role="user",
            name=f"Seed User {index:02d}",
            email=f"user{index:02d}.seed@gamata.test",
        )
        for index in range(1, user_count + 1)
    ]
    return admin, coaches, users


def muscle_group_specs() -> list[tuple[str, str, bool]]:
    return [
        ("Chest", "chest", True),
        ("Back", "back", True),
        ("Legs", "legs", True),
        ("Shoulders", "shoulders", True),
        ("Arms", "arms", True),
        ("Core", "core", True),
        ("Full-Body", "full-body", True),
        ("Glutes", "glutes", False),
        ("Calves", "calves", False),
    ]


def cardio_type_specs() -> dict[str, str]:
    return {
        "HIIT": "High-intensity intervals with short rests.",
        "Steady State": "Sustained moderate-intensity cardio.",
        "Interval": "Alternating high and low effort intervals.",
        "Circuit": "Continuous station-based cardio circuits.",
    }


def build_workout_specs(seed_tag: str) -> list[WorkoutSpec]:
    prefix = f"[{seed_tag}]"
    return [
        WorkoutSpec(
            name=f"{prefix} Flat Bench Press",
            workout_type="strength",
            muscle_groups=("Chest", "Arms"),
            description="Horizontal press strength movement.",
            instructions="Control descent and drive through full lockout.",
            target_sets=4,
            target_reps=8,
            suggested_weight=Decimal("60.0"),
        ),
        WorkoutSpec(
            name=f"{prefix} Incline Dumbbell Press",
            workout_type="strength",
            muscle_groups=("Chest", "Shoulders"),
            description="Upper chest and front shoulder push.",
            instructions="Press on incline bench while keeping wrists neutral.",
            target_sets=3,
            target_reps=10,
            suggested_weight=Decimal("24.0"),
        ),
        WorkoutSpec(
            name=f"{prefix} Bent-Over Row",
            workout_type="strength",
            muscle_groups=("Back", "Arms"),
            description="Posterior-chain pulling movement.",
            instructions="Hinge at hips, keep torso stable, row with control.",
            target_sets=4,
            target_reps=8,
            suggested_weight=Decimal("55.0"),
        ),
        WorkoutSpec(
            name=f"{prefix} Deadlift",
            workout_type="strength",
            muscle_groups=("Back", "Legs"),
            description="Heavy posterior-chain compound lift.",
            instructions="Brace, pull from floor, and lock hips at top.",
            target_sets=3,
            target_reps=5,
            suggested_weight=Decimal("100.0"),
        ),
        WorkoutSpec(
            name=f"{prefix} Back Squat",
            workout_type="strength",
            muscle_groups=("Legs", "Glutes"),
            description="Lower-body compound squat.",
            instructions="Descend below parallel and drive through mid-foot.",
            target_sets=4,
            target_reps=6,
            suggested_weight=Decimal("90.0"),
        ),
        WorkoutSpec(
            name=f"{prefix} Walking Lunge",
            workout_type="strength",
            muscle_groups=("Legs", "Glutes"),
            description="Unilateral lower-body movement.",
            instructions="Take long controlled steps and keep torso upright.",
            target_sets=3,
            target_reps=12,
            suggested_weight=Decimal("20.0"),
        ),
        WorkoutSpec(
            name=f"{prefix} Overhead Press",
            workout_type="strength",
            muscle_groups=("Shoulders", "Arms"),
            description="Vertical press for shoulders and triceps.",
            instructions="Press straight overhead while maintaining a braced core.",
            target_sets=4,
            target_reps=6,
            suggested_weight=Decimal("42.5"),
        ),
        WorkoutSpec(
            name=f"{prefix} Lateral Raise",
            workout_type="strength",
            muscle_groups=("Shoulders",),
            description="Shoulder isolation movement.",
            instructions="Raise dumbbells to shoulder height with slow tempo.",
            target_sets=3,
            target_reps=14,
            suggested_weight=Decimal("8.0"),
        ),
        WorkoutSpec(
            name=f"{prefix} Biceps Curl",
            workout_type="strength",
            muscle_groups=("Arms",),
            description="Arm flexor isolation.",
            instructions="Keep elbows fixed and control eccentric.",
            target_sets=3,
            target_reps=12,
            suggested_weight=Decimal("16.0"),
        ),
        WorkoutSpec(
            name=f"{prefix} Triceps Dip",
            workout_type="strength",
            muscle_groups=("Arms", "Chest"),
            description="Bodyweight triceps-focused push.",
            instructions="Maintain shoulder stability and full elbow extension.",
            target_sets=3,
            target_reps=10,
            suggested_weight=Decimal("0"),
        ),
        WorkoutSpec(
            name=f"{prefix} Plank Hold",
            workout_type="strength",
            muscle_groups=("Core",),
            description="Isometric trunk stability hold.",
            instructions="Hold neutral spine and breathe steadily.",
            target_sets=3,
            target_reps=1,
            suggested_weight=Decimal("0"),
        ),
        WorkoutSpec(
            name=f"{prefix} Calf Raise",
            workout_type="strength",
            muscle_groups=("Calves",),
            description="Lower-leg isolation movement.",
            instructions="Pause at top contraction and lower fully.",
            target_sets=4,
            target_reps=15,
            suggested_weight=Decimal("30.0"),
        ),
        WorkoutSpec(
            name=f"{prefix} Treadmill Intervals",
            workout_type="cardio",
            muscle_groups=("Full-Body", "Legs"),
            description="Alternating high/low speed run intervals.",
            instructions="Alternate sprint and recovery pace each interval.",
            cardio_type_name="Interval",
            target_duration=24 * 60,
            difficulty_level="hard",
        ),
        WorkoutSpec(
            name=f"{prefix} Bike Endurance",
            workout_type="cardio",
            muscle_groups=("Full-Body", "Legs"),
            description="Steady-state cycling session.",
            instructions="Maintain moderate cadence and sustained effort.",
            cardio_type_name="Steady State",
            target_duration=30 * 60,
            difficulty_level="medium",
        ),
        WorkoutSpec(
            name=f"{prefix} Rower HIIT",
            workout_type="cardio",
            muscle_groups=("Full-Body", "Back"),
            description="Short explosive rowing efforts with rests.",
            instructions="Hard pulls for work intervals, easy row during rests.",
            cardio_type_name="HIIT",
            target_duration=18 * 60,
            difficulty_level="hard",
        ),
        WorkoutSpec(
            name=f"{prefix} Stair Circuit",
            workout_type="cardio",
            muscle_groups=("Full-Body", "Calves"),
            description="Continuous stair-climb conditioning.",
            instructions="Sustain cadence and avoid over-gripping handles.",
            cardio_type_name="Circuit",
            target_duration=20 * 60,
            difficulty_level="medium",
        ),
    ]

