"""Seed Phase 2 reference and starter workout data."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "202602090002"
down_revision = "202602090001"
branch_labels = None
depends_on = None

MUSCLE_GROUPS: list[tuple[str, str, str, bool]] = [
    ("10000000-0000-0000-0000-000000000001", "Chest", "chest", True),
    ("10000000-0000-0000-0000-000000000002", "Back", "back", True),
    ("10000000-0000-0000-0000-000000000003", "Legs", "legs", True),
    ("10000000-0000-0000-0000-000000000004", "Shoulders", "shoulders", True),
    ("10000000-0000-0000-0000-000000000005", "Arms", "arms", True),
    ("10000000-0000-0000-0000-000000000006", "Core", "core", True),
    ("10000000-0000-0000-0000-000000000007", "Full-Body", "full-body", True),
]

CARDIO_TYPES: list[tuple[str, str, str]] = [
    (
        "20000000-0000-0000-0000-000000000001",
        "HIIT",
        "High-intensity intervals with short rest periods.",
    ),
    (
        "20000000-0000-0000-0000-000000000002",
        "Steady State",
        "Continuous effort at moderate intensity.",
    ),
    (
        "20000000-0000-0000-0000-000000000003",
        "Interval",
        "Alternating high and low intensity intervals.",
    ),
    (
        "20000000-0000-0000-0000-000000000004",
        "Circuit",
        "Back-to-back exercises with minimal rest.",
    ),
]

WORKOUTS: list[dict[str, str | None]] = [
    {
        "id": "30000000-0000-0000-0000-000000000001",
        "name": "Bench Press",
        "description": "Compound barbell press focusing chest strength.",
        "instructions": "Lower bar to chest with control and press to full extension.",
        "type": "strength",
        "cardio_type_id": None,
    },
    {
        "id": "30000000-0000-0000-0000-000000000002",
        "name": "Incline Dumbbell Press",
        "description": "Upper-chest focused dumbbell pressing movement.",
        "instructions": "Press dumbbells upward on an incline bench while keeping shoulders packed.",
        "type": "strength",
        "cardio_type_id": None,
    },
    {
        "id": "30000000-0000-0000-0000-000000000003",
        "name": "Push-Up",
        "description": "Bodyweight pressing movement for chest and triceps.",
        "instructions": "Maintain a rigid plank, descend chest toward floor, and press up.",
        "type": "strength",
        "cardio_type_id": None,
    },
    {
        "id": "30000000-0000-0000-0000-000000000004",
        "name": "Bent-Over Row",
        "description": "Posterior-chain pull targeting lats and mid-back.",
        "instructions": "Hinge at hips, keep spine neutral, and row bar to lower chest.",
        "type": "strength",
        "cardio_type_id": None,
    },
    {
        "id": "30000000-0000-0000-0000-000000000005",
        "name": "Pull-Up",
        "description": "Bodyweight vertical pull exercise.",
        "instructions": "Pull chest toward bar while controlling descent to full arm extension.",
        "type": "strength",
        "cardio_type_id": None,
    },
    {
        "id": "30000000-0000-0000-0000-000000000006",
        "name": "Deadlift",
        "description": "Full posterior-chain strength movement.",
        "instructions": "Drive through floor, keep bar close to shins, and stand tall at lockout.",
        "type": "strength",
        "cardio_type_id": None,
    },
    {
        "id": "30000000-0000-0000-0000-000000000007",
        "name": "Back Squat",
        "description": "Compound lower-body strength exercise.",
        "instructions": "Descend below parallel with neutral spine and stand up through mid-foot.",
        "type": "strength",
        "cardio_type_id": None,
    },
    {
        "id": "30000000-0000-0000-0000-000000000008",
        "name": "Walking Lunge",
        "description": "Unilateral leg exercise for quads and glutes.",
        "instructions": "Step forward into lunge, keep torso upright, and alternate legs.",
        "type": "strength",
        "cardio_type_id": None,
    },
    {
        "id": "30000000-0000-0000-0000-000000000009",
        "name": "Leg Press",
        "description": "Machine-based lower-body compound movement.",
        "instructions": "Lower sled under control and press without locking knees aggressively.",
        "type": "strength",
        "cardio_type_id": None,
    },
    {
        "id": "30000000-0000-0000-0000-000000000010",
        "name": "Overhead Press",
        "description": "Standing shoulder press for deltoid and triceps strength.",
        "instructions": "Brace core and press bar overhead in a straight path.",
        "type": "strength",
        "cardio_type_id": None,
    },
    {
        "id": "30000000-0000-0000-0000-000000000011",
        "name": "Lateral Raise",
        "description": "Isolation movement for lateral deltoids.",
        "instructions": "Raise dumbbells to shoulder height with slight elbow bend.",
        "type": "strength",
        "cardio_type_id": None,
    },
    {
        "id": "30000000-0000-0000-0000-000000000012",
        "name": "Biceps Curl",
        "description": "Arm isolation movement for elbow flexors.",
        "instructions": "Curl through full range without swinging torso.",
        "type": "strength",
        "cardio_type_id": None,
    },
    {
        "id": "30000000-0000-0000-0000-000000000013",
        "name": "Triceps Dip",
        "description": "Bodyweight triceps-focused pushing movement.",
        "instructions": "Lower with control and press to full elbow extension.",
        "type": "strength",
        "cardio_type_id": None,
    },
    {
        "id": "30000000-0000-0000-0000-000000000014",
        "name": "Plank Hold",
        "description": "Isometric core stability exercise.",
        "instructions": "Maintain straight-line posture while bracing core and glutes.",
        "type": "strength",
        "cardio_type_id": None,
    },
    {
        "id": "30000000-0000-0000-0000-000000000015",
        "name": "Russian Twist",
        "description": "Rotational core exercise.",
        "instructions": "Rotate torso side to side while keeping feet stable.",
        "type": "strength",
        "cardio_type_id": None,
    },
    {
        "id": "30000000-0000-0000-0000-000000000016",
        "name": "Glute Bridge",
        "description": "Hip extension movement targeting glutes and hamstrings.",
        "instructions": "Drive hips upward and pause at top without lower-back overextension.",
        "type": "strength",
        "cardio_type_id": None,
    },
    {
        "id": "30000000-0000-0000-0000-000000000017",
        "name": "Treadmill Run",
        "description": "Steady-state running session.",
        "instructions": "Maintain consistent pace and controlled breathing.",
        "type": "cardio",
        "cardio_type_id": "20000000-0000-0000-0000-000000000002",
    },
    {
        "id": "30000000-0000-0000-0000-000000000018",
        "name": "Indoor Cycling",
        "description": "Steady cycling effort for cardiovascular endurance.",
        "instructions": "Pedal at moderate cadence and adjust resistance as needed.",
        "type": "cardio",
        "cardio_type_id": "20000000-0000-0000-0000-000000000002",
    },
    {
        "id": "30000000-0000-0000-0000-000000000019",
        "name": "Rowing Machine Intervals",
        "description": "Alternating hard and easy rowing intervals.",
        "instructions": "Alternate sprint and recovery intervals with consistent technique.",
        "type": "cardio",
        "cardio_type_id": "20000000-0000-0000-0000-000000000003",
    },
    {
        "id": "30000000-0000-0000-0000-000000000020",
        "name": "Jump Rope",
        "description": "Coordination-heavy cardio conditioning.",
        "instructions": "Keep jumps light and cadence steady during work periods.",
        "type": "cardio",
        "cardio_type_id": "20000000-0000-0000-0000-000000000001",
    },
    {
        "id": "30000000-0000-0000-0000-000000000021",
        "name": "Stair Climber",
        "description": "Lower-body endurance conditioning.",
        "instructions": "Step smoothly and avoid leaning heavily on handles.",
        "type": "cardio",
        "cardio_type_id": "20000000-0000-0000-0000-000000000002",
    },
    {
        "id": "30000000-0000-0000-0000-000000000022",
        "name": "Elliptical Trainer",
        "description": "Low-impact cardio session.",
        "instructions": "Maintain full stride and stable cadence throughout.",
        "type": "cardio",
        "cardio_type_id": "20000000-0000-0000-0000-000000000002",
    },
    {
        "id": "30000000-0000-0000-0000-000000000023",
        "name": "HIIT Circuit",
        "description": "High-intensity bodyweight interval circuit.",
        "instructions": "Perform work intervals aggressively with short rests between rounds.",
        "type": "cardio",
        "cardio_type_id": "20000000-0000-0000-0000-000000000001",
    },
    {
        "id": "30000000-0000-0000-0000-000000000024",
        "name": "Brisk Walk",
        "description": "Accessible steady-state cardio option.",
        "instructions": "Sustain brisk pace with upright posture and rhythmic breathing.",
        "type": "cardio",
        "cardio_type_id": "20000000-0000-0000-0000-000000000002",
    },
]

WORKOUT_MUSCLE_MAP: list[tuple[str, str]] = [
    ("Bench Press", "Chest"),
    ("Incline Dumbbell Press", "Chest"),
    ("Push-Up", "Chest"),
    ("Bent-Over Row", "Back"),
    ("Pull-Up", "Back"),
    ("Deadlift", "Back"),
    ("Deadlift", "Legs"),
    ("Back Squat", "Legs"),
    ("Walking Lunge", "Legs"),
    ("Leg Press", "Legs"),
    ("Overhead Press", "Shoulders"),
    ("Lateral Raise", "Shoulders"),
    ("Biceps Curl", "Arms"),
    ("Triceps Dip", "Arms"),
    ("Plank Hold", "Core"),
    ("Russian Twist", "Core"),
    ("Glute Bridge", "Legs"),
    ("Treadmill Run", "Full-Body"),
    ("Indoor Cycling", "Legs"),
    ("Rowing Machine Intervals", "Full-Body"),
    ("Jump Rope", "Full-Body"),
    ("Stair Climber", "Legs"),
    ("Elliptical Trainer", "Full-Body"),
    ("HIIT Circuit", "Full-Body"),
    ("Brisk Walk", "Full-Body"),
]


def _uuid(value: str) -> uuid.UUID:
    return uuid.UUID(value)


def _uuid_array_sql(values: list[str]) -> str:
    return f"ARRAY[{', '.join(repr(v) for v in values)}]::uuid[]"


def upgrade() -> None:
    timestamp = datetime.now(timezone.utc)

    muscle_groups_table = sa.table(
        "muscle_groups",
        sa.column("id", postgresql.UUID(as_uuid=True)),
        sa.column("name", sa.String(length=120)),
        sa.column("icon", sa.String(length=120)),
        sa.column("is_default", sa.Boolean()),
        sa.column("created_at", sa.DateTime(timezone=True)),
    )
    cardio_types_table = sa.table(
        "cardio_types",
        sa.column("id", postgresql.UUID(as_uuid=True)),
        sa.column("name", sa.String(length=120)),
        sa.column("description", sa.Text()),
    )
    workouts_table = sa.table(
        "workouts",
        sa.column("id", postgresql.UUID(as_uuid=True)),
        sa.column("name", sa.String(length=160)),
        sa.column("description", sa.Text()),
        sa.column("instructions", sa.Text()),
        sa.column("type", sa.String()),
        sa.column("cardio_type_id", postgresql.UUID(as_uuid=True)),
        sa.column("is_archived", sa.Boolean()),
        sa.column("created_at", sa.DateTime(timezone=True)),
        sa.column("updated_at", sa.DateTime(timezone=True)),
    )
    workout_muscle_groups_table = sa.table(
        "workout_muscle_groups",
        sa.column("workout_id", postgresql.UUID(as_uuid=True)),
        sa.column("muscle_group_id", postgresql.UUID(as_uuid=True)),
    )

    op.bulk_insert(
        muscle_groups_table,
        [
            {
                "id": _uuid(muscle_id),
                "name": name,
                "icon": icon,
                "is_default": is_default,
                "created_at": timestamp,
            }
            for muscle_id, name, icon, is_default in MUSCLE_GROUPS
        ],
    )

    op.bulk_insert(
        cardio_types_table,
        [
            {"id": _uuid(cardio_type_id), "name": name, "description": description}
            for cardio_type_id, name, description in CARDIO_TYPES
        ],
    )

    op.bulk_insert(
        workouts_table,
        [
            {
                "id": _uuid(str(workout["id"])),
                "name": workout["name"],
                "description": workout["description"],
                "instructions": workout["instructions"],
                "type": workout["type"],
                "cardio_type_id": (
                    _uuid(str(workout["cardio_type_id"]))
                    if workout["cardio_type_id"]
                    else None
                ),
                "is_archived": False,
                "created_at": timestamp,
                "updated_at": timestamp,
            }
            for workout in WORKOUTS
        ],
    )

    workout_ids = {
        str(workout["name"]): _uuid(str(workout["id"])) for workout in WORKOUTS
    }
    muscle_group_ids = {
        name: _uuid(muscle_id) for muscle_id, name, _, _ in MUSCLE_GROUPS
    }

    op.bulk_insert(
        workout_muscle_groups_table,
        [
            {
                "workout_id": workout_ids[workout_name],
                "muscle_group_id": muscle_group_ids[muscle_name],
            }
            for workout_name, muscle_name in WORKOUT_MUSCLE_MAP
        ],
    )


def downgrade() -> None:
    workout_ids = [str(workout["id"]) for workout in WORKOUTS]
    cardio_type_ids = [cardio_type_id for cardio_type_id, _, _ in CARDIO_TYPES]
    muscle_group_ids = [muscle_id for muscle_id, _, _, _ in MUSCLE_GROUPS]

    op.execute(
        f"""
        DELETE FROM workout_muscle_groups
        WHERE workout_id = ANY({_uuid_array_sql(workout_ids)})
        """
    )
    op.execute(
        f"""
        DELETE FROM workouts
        WHERE id = ANY({_uuid_array_sql(workout_ids)})
        """
    )
    op.execute(
        f"""
        DELETE FROM cardio_types
        WHERE id = ANY({_uuid_array_sql(cardio_type_ids)})
        """
    )
    op.execute(
        f"""
        DELETE FROM muscle_groups
        WHERE id = ANY({_uuid_array_sql(muscle_group_ids)})
        """
    )
