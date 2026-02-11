"""Database and Supabase seeding operations."""
from __future__ import annotations
from datetime import date, datetime, time, timedelta, timezone
from pathlib import Path
from typing import Any
from uuid import UUID
from .config import (
    AccountSpec,
    SeedScriptError,
    WorkoutSpec,
    build_account_specs,
    build_workout_specs,
    cardio_type_specs,
    muscle_group_specs,
    seed_uuid,
)
from .support import (
    assert_schema_compatible,
    extract_attr,
    extract_auth_user_id,
    find_auth_user_by_email,
    sync_auth_user_password,
)

def run_seed(args, *, backend_dir: Path) -> dict[str, Any]:
    import sys
    if str(backend_dir) not in sys.path:
        sys.path.insert(0, str(backend_dir))
    from sqlalchemy import func, select
    from app.database import SessionLocal, supabase_admin
    from models.enums import CardioDifficultyLevel, PlanAssignmentStatus, SessionType, UserRole, WorkoutType
    from models.plan import PlanAssignment, PlanDay, WorkoutPlan
    from models.session import ExerciseLog, WorkoutSession
    from models.user import CoachUserAssignment, User
    from models.workout import CardioType, MuscleGroup, Workout

    def role_from_string(role: str) -> UserRole:
        mapping = {"admin": UserRole.ADMIN, "coach": UserRole.COACH, "user": UserRole.USER}
        if role not in mapping:
            raise SeedScriptError(f"Unsupported role: {role}")
        return mapping[role]
    def ensure_auth_and_local_user(db, spec: AccountSpec) -> User:
        role_enum = role_from_string(spec.role)
        existing = db.scalar(select(User).where(User.email == spec.email))
        if existing is not None:
            sync_auth_user_password(
                supabase_admin,
                auth_user_id=existing.id,
                email=spec.email,
                name=spec.name,
                role_value=role_enum.value,
                password=args.shared_password,
            )
            existing.name = spec.name
            existing.role = role_enum
            existing.is_active = True
            existing.deactivated_at = None
            db.commit()
            db.refresh(existing)
            return existing
        created_new_auth_user = False
        try:
            auth_result = supabase_admin.auth.admin.create_user(
                {
                    "email": spec.email,
                    "password": args.shared_password,
                    "email_confirm": True,
                    "user_metadata": {"name": spec.name, "role": role_enum.value},
                }
            )
            auth_user_id = extract_auth_user_id(auth_result)
            created_new_auth_user = True
        except Exception as create_exc:  # noqa: BLE001
            existing_auth_user = find_auth_user_by_email(supabase_admin, spec.email)
            if existing_auth_user is None:
                raise SeedScriptError(f"Failed creating auth user for {spec.email}.") from create_exc
            try:
                auth_user_id = UUID(str(extract_attr(existing_auth_user, "id")))
            except ValueError as value_exc:
                raise SeedScriptError(
                    f"Existing auth user for {spec.email} has invalid id."
                ) from value_exc
            sync_auth_user_password(
                supabase_admin,
                auth_user_id=auth_user_id,
                email=spec.email,
                name=spec.name,
                role_value=role_enum.value,
                password=args.shared_password,
            )
        user = User(
            id=auth_user_id,
            name=spec.name,
            email=spec.email,
            role=role_enum,
            is_active=True,
        )
        db.add(user)
        try:
            db.commit()
        except Exception as exc:  # noqa: BLE001
            db.rollback()
            if created_new_auth_user:
                try:
                    supabase_admin.auth.admin.delete_user(str(auth_user_id))
                except Exception as cleanup_exc:  # noqa: BLE001
                    raise SeedScriptError(
                        f"Local user insert failed for {spec.email}; cleanup of auth user also failed."
                    ) from cleanup_exc
            raise SeedScriptError(f"Failed creating local user for {spec.email}.") from exc
        db.refresh(user)
        return user
    def ensure_muscle_group(db, *, name: str, icon: str, is_default: bool) -> MuscleGroup:
        group = db.scalar(select(MuscleGroup).where(MuscleGroup.name == name))
        if group is None:
            group = MuscleGroup(
                id=seed_uuid(args.seed_tag, "muscle-group", name),
                name=name,
                icon=icon,
                is_default=is_default,
            )
            db.add(group)
        else:
            group.icon = icon
            group.is_default = group.is_default or is_default
        db.commit()
        db.refresh(group)
        return group
    def ensure_cardio_type(db, *, name: str, description: str) -> CardioType:
        cardio_type = db.scalar(select(CardioType).where(CardioType.name == name))
        if cardio_type is None:
            cardio_type = CardioType(
                id=seed_uuid(args.seed_tag, "cardio-type", name),
                name=name,
                description=description,
            )
            db.add(cardio_type)
        else:
            cardio_type.description = description
        db.commit()
        db.refresh(cardio_type)
        return cardio_type
    def ensure_workout(
        db,
        *,
        spec: WorkoutSpec,
        muscle_group_map: dict[str, MuscleGroup],
        cardio_type_map: dict[str, CardioType],
    ) -> Workout:
        workout = db.scalar(select(Workout).where(Workout.name == spec.name))
        groups = [muscle_group_map[name] for name in spec.muscle_groups]

        if spec.workout_type == "strength":
            workout_type = WorkoutType.STRENGTH
            cardio_type_id = None
            difficulty = None
        else:
            workout_type = WorkoutType.CARDIO
            cardio_name = spec.cardio_type_name or ""
            cardio_type_id = cardio_type_map[cardio_name].id
            difficulty = {
                "easy": CardioDifficultyLevel.EASY,
                "hard": CardioDifficultyLevel.HARD,
            }.get(spec.difficulty_level, CardioDifficultyLevel.MEDIUM)

        if workout is None:
            workout = Workout(
                id=seed_uuid(args.seed_tag, "workout", spec.name),
                name=spec.name,
                description=spec.description,
                instructions=spec.instructions,
                type=workout_type,
                cardio_type_id=cardio_type_id,
                target_sets=spec.target_sets,
                target_reps=spec.target_reps,
                suggested_weight=spec.suggested_weight,
                target_duration=spec.target_duration,
                difficulty_level=difficulty,
                is_archived=False,
            )
            db.add(workout)
        else:
            workout.description = spec.description
            workout.instructions = spec.instructions
            workout.type = workout_type
            workout.cardio_type_id = cardio_type_id
            workout.target_sets = spec.target_sets
            workout.target_reps = spec.target_reps
            workout.suggested_weight = spec.suggested_weight
            workout.target_duration = spec.target_duration
            workout.difficulty_level = difficulty
            workout.is_archived = False
        workout.muscle_groups = groups
        db.commit()
        db.refresh(workout)
        return workout
    def ensure_coach_assignment(db, *, coach_id: UUID, user_id: UUID, admin_id: UUID) -> None:
        existing = db.scalar(
            select(CoachUserAssignment).where(
                CoachUserAssignment.coach_id == coach_id,
                CoachUserAssignment.user_id == user_id,
            )
        )
        if existing is None:
            db.add(
                CoachUserAssignment(
                    id=seed_uuid(args.seed_tag, "coach-user", str(coach_id), str(user_id)),
                    coach_id=coach_id,
                    user_id=user_id,
                    assigned_by=admin_id,
                )
            )
            db.commit()
    def ensure_plan(
        db,
        *,
        coach: User,
        name: str,
        day_workout_map: dict[int, list[Workout]],
        start_date: date,
        end_date: date,
    ) -> WorkoutPlan:
        plan = db.scalar(
            select(WorkoutPlan).where(WorkoutPlan.coach_id == coach.id, WorkoutPlan.name == name)
        )
        if plan is None:
            plan = WorkoutPlan(
                id=seed_uuid(args.seed_tag, "plan", coach.email, name),
                name=name,
                coach_id=coach.id,
                start_date=start_date,
                end_date=end_date,
                is_archived=False,
            )
            db.add(plan)
            db.flush()
        else:
            plan.start_date = start_date
            plan.end_date = end_date
            plan.is_archived = False
            plan.archived_at = None

        existing_days = {day.day_of_week: day for day in plan.days}
        desired_days = set(day_workout_map.keys())
        for day_of_week, workouts in day_workout_map.items():
            day = existing_days.get(day_of_week)
            if day is None:
                day = PlanDay(
                    id=seed_uuid(args.seed_tag, "plan-day", str(plan.id), str(day_of_week)),
                    day_of_week=day_of_week,
                )
                plan.days.append(day)
            day.workouts = workouts
        for day in list(plan.days):
            if day.day_of_week not in desired_days:
                plan.days.remove(day)
        db.commit()
        db.refresh(plan)
        return plan
    def ensure_plan_assignment(
        db,
        *,
        assignment_id: UUID,
        user_id: UUID,
        plan_id: UUID,
        status: PlanAssignmentStatus,
        assigned_at: datetime,
        activated_at: datetime | None,
        deactivated_at: datetime | None,
    ) -> None:
        assignment = db.scalar(select(PlanAssignment).where(PlanAssignment.id == assignment_id))
        if assignment is None:
            assignment = PlanAssignment(id=assignment_id)
            db.add(assignment)
        assignment.user_id = user_id
        assignment.plan_id = plan_id
        assignment.status = status
        assignment.assigned_at = assigned_at
        assignment.activated_at = activated_at
        assignment.deactivated_at = deactivated_at

        if status == PlanAssignmentStatus.ACTIVE:
            others = db.scalars(
                select(PlanAssignment).where(
                    PlanAssignment.user_id == user_id,
                    PlanAssignment.status == PlanAssignmentStatus.ACTIVE,
                    PlanAssignment.id != assignment_id,
                )
            ).all()
            for existing in others:
                existing.status = PlanAssignmentStatus.INACTIVE
                existing.deactivated_at = assigned_at
        db.commit()
    def ensure_session_and_logs(
        db,
        *,
        session_id: UUID,
        user_id: UUID,
        workout: Workout,
        plan_id: UUID | None,
        session_type: SessionType,
        completed_at: datetime,
        log_count: int,
        slot_index: int,
    ) -> None:
        session = db.scalar(select(WorkoutSession).where(WorkoutSession.id == session_id))
        if session is None:
            session = WorkoutSession(id=session_id)
            db.add(session)
        session.user_id = user_id
        session.workout_id = workout.id
        session.plan_id = plan_id
        session.session_type = session_type
        session.completed_at = completed_at
        db.flush()

        existing_logs = {
            row.id: row
            for row in db.scalars(select(ExerciseLog).where(ExerciseLog.session_id == session_id)).all()
        }
        desired_ids: set[UUID] = set()
        for log_index in range(log_count):
            log_id = seed_uuid(args.seed_tag, "log", str(session_id), str(log_index))
            desired_ids.add(log_id)
            if workout.type == WorkoutType.STRENGTH:
                sets_value = 3 + (slot_index % 2)
                reps_value = 8 + (log_index * 2)
                weight_value = 35 + ((slot_index + log_index) * 2.5)
                duration_value = None
            else:
                sets_value = None
                reps_value = None
                weight_value = None
                duration_value = int(max(300, (workout.target_duration or 1200) // (log_count + 1)))
            log = existing_logs.get(log_id)
            if log is None:
                log = ExerciseLog(id=log_id, session_id=session_id)
                db.add(log)
            log.sets = sets_value
            log.reps = reps_value
            log.weight = weight_value
            log.duration = duration_value
            log.notes = f"Seeded session slot {slot_index} log {log_index + 1}"
            log.logged_at = completed_at + timedelta(minutes=5 * (log_index + 1))
        for log_id, log in existing_logs.items():
            if log_id not in desired_ids:
                db.delete(log)
        db.commit()
    admin_spec, coach_specs, user_specs = build_account_specs(args.coaches, args.users)
    now = datetime.now(timezone.utc)
    today = now.date()
    plan_start = today - timedelta(days=14)
    plan_end = today + timedelta(days=84)
    seeded_accounts: list[AccountSpec] = []
    seeded_session_ids: list[UUID] = []
    seeded_assignment_ids: list[UUID] = []
    with SessionLocal() as db:
        assert_schema_compatible(db)
        admin_user = ensure_auth_and_local_user(db, admin_spec)
        seeded_accounts.append(admin_spec)
        coach_users = [ensure_auth_and_local_user(db, spec) for spec in coach_specs]
        seeded_accounts.extend(coach_specs)
        app_users = [ensure_auth_and_local_user(db, spec) for spec in user_specs]
        seeded_accounts.extend(user_specs)
        mg_map = {
            name: ensure_muscle_group(db, name=name, icon=icon, is_default=is_default)
            for name, icon, is_default in muscle_group_specs()
        }
        ct_map = {
            name: ensure_cardio_type(db, name=name, description=desc)
            for name, desc in cardio_type_specs().items()
        }
        workout_specs = build_workout_specs(args.seed_tag)
        workout_map = {
            spec.name: ensure_workout(db, spec=spec, muscle_group_map=mg_map, cardio_type_map=ct_map)
            for spec in workout_specs
        }
        strength = [w for w in workout_map.values() if w.type == WorkoutType.STRENGTH]
        cardio = [w for w in workout_map.values() if w.type == WorkoutType.CARDIO]
        plans_by_coach: dict[UUID, dict[str, WorkoutPlan]] = {}
        for coach_idx, coach in enumerate(coach_users):
            s0, s1, s2, s3 = [strength[(coach_idx * 4 + offset) % len(strength)] for offset in range(4)]
            c0, c1 = [cardio[(coach_idx * 2 + offset) % len(cardio)] for offset in range(2)]
            c2 = strength[(coach_idx * 3 + 5) % len(strength)]
            c3 = strength[(coach_idx * 3 + 6) % len(strength)]
            plans_by_coach[coach.id] = {
                "strength": ensure_plan(
                    db,
                    coach=coach,
                    name=f"[{args.seed_tag}] Coach {coach_idx + 1} Strength Plan",
                    day_workout_map={0: [s0, s1], 2: [s2, s3], 4: [s0, s2]},
                    start_date=plan_start,
                    end_date=plan_end,
                ),
                "conditioning": ensure_plan(
                    db,
                    coach=coach,
                    name=f"[{args.seed_tag}] Coach {coach_idx + 1} Conditioning Plan",
                    day_workout_map={1: [c0, c2], 3: [c1, c3], 5: [c0, c1]},
                    start_date=plan_start,
                    end_date=plan_end,
                ),
            }
        for idx, athlete in enumerate(app_users):
            primary = coach_users[idx % len(coach_users)]
            ensure_coach_assignment(db, coach_id=primary.id, user_id=athlete.id, admin_id=admin_user.id)
            if idx % 3 == 0 and len(coach_users) > 1:
                secondary = coach_users[(idx + 1) % len(coach_users)]
                ensure_coach_assignment(db, coach_id=secondary.id, user_id=athlete.id, admin_id=admin_user.id)

            plans = plans_by_coach[primary.id]
            active_plan = plans["strength"] if idx % 2 == 0 else plans["conditioning"]
            pending_plan = plans["conditioning"] if active_plan.id == plans["strength"].id else plans["strength"]
            assigned_at = datetime.combine(today, time(7, 0), tzinfo=timezone.utc) - timedelta(days=20 - idx)
            active_assignment_id = seed_uuid(args.seed_tag, "assignment", athlete.email, "active")
            seeded_assignment_ids.append(active_assignment_id)
            ensure_plan_assignment(
                db,
                assignment_id=active_assignment_id,
                user_id=athlete.id,
                plan_id=active_plan.id,
                status=PlanAssignmentStatus.ACTIVE,
                assigned_at=assigned_at,
                activated_at=assigned_at + timedelta(hours=2),
                deactivated_at=None,
            )
            if idx % 2 == 0:
                pending_id = seed_uuid(args.seed_tag, "assignment", athlete.email, "pending")
                seeded_assignment_ids.append(pending_id)
                ensure_plan_assignment(
                    db,
                    assignment_id=pending_id,
                    user_id=athlete.id,
                    plan_id=pending_plan.id,
                    status=PlanAssignmentStatus.PENDING,
                    assigned_at=assigned_at + timedelta(days=5),
                    activated_at=None,
                    deactivated_at=None,
                )
            if idx < 2:
                historical_id = seed_uuid(args.seed_tag, "assignment", athlete.email, "historical")
                seeded_assignment_ids.append(historical_id)
                ensure_plan_assignment(
                    db,
                    assignment_id=historical_id,
                    user_id=athlete.id,
                    plan_id=pending_plan.id,
                    status=PlanAssignmentStatus.INACTIVE,
                    assigned_at=assigned_at - timedelta(days=20),
                    activated_at=assigned_at - timedelta(days=19, hours=20),
                    deactivated_at=assigned_at - timedelta(days=5),
                )
            active_workouts = [w for d in active_plan.days for w in d.workouts]
            other_workouts = [w for d in pending_plan.days for w in d.workouts]
            offsets = [1, 4, 7, 10, 14, 18, 22, 27]
            for slot, days_ago in enumerate(offsets):
                session_id = seed_uuid(args.seed_tag, "session", athlete.email, str(slot))
                seeded_session_ids.append(session_id)
                completed_at = datetime.combine(today - timedelta(days=days_ago), time(6 + (slot % 4), 30), tzinfo=timezone.utc)
                if slot <= 3:
                    s_type, plan_id, workout, logs = SessionType.ASSIGNED, active_plan.id, active_workouts[slot % len(active_workouts)], 2
                elif slot in (4, 5):
                    s_type, plan_id, workout, logs = SessionType.SWAP, active_plan.id, other_workouts[slot % len(other_workouts)], 1
                elif slot == 6:
                    s_type, plan_id, workout, logs = SessionType.ADHOC, None, strength[(idx + slot) % len(strength)], 1
                else:
                    s_type, plan_id, workout, logs = SessionType.ADHOC, None, cardio[(idx + slot) % len(cardio)], 1
                ensure_session_and_logs(
                    db,
                    session_id=session_id,
                    user_id=athlete.id,
                    workout=workout,
                    plan_id=plan_id,
                    session_type=s_type,
                    completed_at=completed_at,
                    log_count=logs,
                    slot_index=slot,
                )
        coach_ids = [coach.id for coach in coach_users]
        user_ids = [u.id for u in app_users]
        plan_ids = [plan.id for mapping in plans_by_coach.values() for plan in mapping.values()]
        counts = {
            "users": int(db.scalar(select(func.count(User.id)).where(User.email.in_([a.email for a in seeded_accounts]))) or 0),
            "coach_user_assignments": int(db.scalar(select(func.count(CoachUserAssignment.id)).where(CoachUserAssignment.coach_id.in_(coach_ids), CoachUserAssignment.user_id.in_(user_ids))) or 0),
            "muscle_groups": int(db.scalar(select(func.count(MuscleGroup.id)).where(MuscleGroup.name.in_([name for name, _, _ in muscle_group_specs()]))) or 0),
            "workouts": int(db.scalar(select(func.count(Workout.id)).where(Workout.name.in_([w.name for w in workout_specs]))) or 0),
            "plans": int(db.scalar(select(func.count(WorkoutPlan.id)).where(WorkoutPlan.id.in_(plan_ids))) or 0),
            "plan_assignments": int(db.scalar(select(func.count(PlanAssignment.id)).where(PlanAssignment.id.in_(seeded_assignment_ids))) or 0),
            "sessions": int(db.scalar(select(func.count(WorkoutSession.id)).where(WorkoutSession.id.in_(seeded_session_ids))) or 0),
            "exercise_logs": int(db.scalar(select(func.count(ExerciseLog.id)).where(ExerciseLog.session_id.in_(seeded_session_ids))) or 0),
        }
    payload = {
        "seed_tag": args.seed_tag,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "shared_password": args.shared_password,
        "accounts": [{"role": s.role, "name": s.name, "email": s.email} for s in seeded_accounts],
        "counts": counts,
    }
    return payload
