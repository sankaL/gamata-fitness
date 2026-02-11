"""Service logic for workout library management."""

from __future__ import annotations

import logging
from typing import Iterable
from uuid import UUID, uuid4

from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from models.enums import PlanAssignmentStatus, WorkoutType
from models.plan import PlanAssignment, PlanDay, PlanDayWorkout, WorkoutPlan
from models.workout import CardioType, MuscleGroup, Workout
from schemas.workouts import (
    CardioTypeResponse,
    MuscleGroupCreateRequest,
    MuscleGroupResponse,
    PaginatedWorkoutsResponse,
    WorkoutArchiveResponse,
    WorkoutCreateRequest,
    WorkoutListQuery,
    WorkoutResponse,
    WorkoutUpdateRequest,
)

logger = logging.getLogger(__name__)


class WorkoutServiceError(Exception):
    """Raised when workout library flows fail with client-safe messages."""

    def __init__(self, detail: str, status_code: int) -> None:
        super().__init__(detail)
        self.detail = detail
        self.status_code = status_code


def _to_workout_response(workout: Workout) -> WorkoutResponse:
    return WorkoutResponse.model_validate(workout)


def _with_workout_relations() -> tuple:
    return (
        selectinload(Workout.muscle_groups),
        selectinload(Workout.cardio_type),
    )


def _get_workout_or_404(db: Session, workout_id: UUID) -> Workout:
    workout = db.scalar(
        select(Workout).where(Workout.id == workout_id).options(*_with_workout_relations())
    )
    if workout is None:
        raise WorkoutServiceError("Workout not found.", 404)
    return workout


def _get_cardio_type_or_404(db: Session, cardio_type_id: UUID) -> CardioType:
    cardio_type = db.scalar(select(CardioType).where(CardioType.id == cardio_type_id))
    if cardio_type is None:
        raise WorkoutServiceError("Cardio type not found.", 404)
    return cardio_type


def _get_muscle_groups_or_404(db: Session, muscle_group_ids: Iterable[UUID]) -> list[MuscleGroup]:
    deduped_ids = list(dict.fromkeys(muscle_group_ids))
    groups = db.scalars(select(MuscleGroup).where(MuscleGroup.id.in_(deduped_ids))).unique().all()
    found_ids = {group.id for group in groups}
    missing_count = len([group_id for group_id in deduped_ids if group_id not in found_ids])
    if missing_count:
        raise WorkoutServiceError("One or more selected muscle groups were not found.", 404)
    return sorted(groups, key=lambda group: group.name.lower())


def _assert_workout_fields(
    *,
    workout_type: WorkoutType,
    cardio_type_id: UUID | None,
    target_sets: int | None,
    target_reps: int | None,
    suggested_weight,
    target_duration: int | None,
    difficulty_level,
) -> None:
    if workout_type == WorkoutType.STRENGTH:
        if target_sets is None or target_reps is None:
            raise WorkoutServiceError("Strength workouts require target sets and target reps.", 400)
        if any(value is not None for value in (cardio_type_id, target_duration, difficulty_level)):
            raise WorkoutServiceError(
                "Cardio-only fields are not allowed for strength workouts.",
                400,
            )
        return

    if cardio_type_id is None or target_duration is None or difficulty_level is None:
        raise WorkoutServiceError(
            "Cardio workouts require cardio type, target duration, and difficulty level.",
            400,
        )
    if any(value is not None for value in (target_sets, target_reps, suggested_weight)):
        raise WorkoutServiceError("Strength-only fields are not allowed for cardio workouts.", 400)


def list_workouts(db: Session, query: WorkoutListQuery) -> PaginatedWorkoutsResponse:
    filters = []
    if query.type is not None:
        filters.append(Workout.type == query.type)
    if query.is_archived is not None:
        filters.append(Workout.is_archived.is_(query.is_archived))
    if query.muscle_group_id is not None:
        filters.append(Workout.muscle_groups.any(MuscleGroup.id == query.muscle_group_id))
    if query.search:
        search_value = f"%{query.search.lower()}%"
        filters.append(
            or_(
                func.lower(Workout.name).like(search_value),
                func.lower(Workout.description).like(search_value),
            )
        )

    list_stmt = (
        select(Workout)
        .where(*filters)
        .options(*_with_workout_relations())
        .order_by(Workout.created_at.desc())
    )
    count_stmt = select(func.count(func.distinct(Workout.id))).where(*filters)

    total = db.scalar(count_stmt) or 0
    offset = (query.page - 1) * query.page_size

    workouts = db.scalars(list_stmt.offset(offset).limit(query.page_size)).unique().all()
    items = [_to_workout_response(workout) for workout in workouts]

    total_pages = (total + query.page_size - 1) // query.page_size if total else 0
    return PaginatedWorkoutsResponse(
        items=items,
        page=query.page,
        page_size=query.page_size,
        total=total,
        total_pages=total_pages,
    )


def list_alternative_workouts(
    db: Session,
    *,
    workout_id: UUID,
    limit: int = 12,
) -> list[WorkoutResponse]:
    source_workout = _get_workout_or_404(db, workout_id)
    source_group_ids = [group.id for group in source_workout.muscle_groups]
    if not source_group_ids:
        return []

    candidates = (
        db.scalars(
            select(Workout)
            .where(
                Workout.id != source_workout.id,
                Workout.is_archived.is_(False),
                Workout.muscle_groups.any(MuscleGroup.id.in_(source_group_ids)),
            )
            .options(*_with_workout_relations())
        )
        .unique()
        .all()
    )

    source_group_set = set(source_group_ids)
    ordered = sorted(
        candidates,
        key=lambda workout: (
            -len(source_group_set.intersection({group.id for group in workout.muscle_groups})),
            workout.name.lower(),
        ),
    )
    return [_to_workout_response(workout) for workout in ordered[: max(limit, 1)]]


def get_workout_detail(db: Session, workout_id: UUID) -> WorkoutResponse:
    workout = _get_workout_or_404(db, workout_id)
    return _to_workout_response(workout)


def create_workout(db: Session, payload: WorkoutCreateRequest) -> WorkoutResponse:
    existing = db.scalar(select(Workout.id).where(func.lower(Workout.name) == payload.name.lower()))
    if existing is not None:
        raise WorkoutServiceError("A workout with this name already exists.", 409)

    _assert_workout_fields(
        workout_type=payload.type,
        cardio_type_id=payload.cardio_type_id,
        target_sets=payload.target_sets,
        target_reps=payload.target_reps,
        suggested_weight=payload.suggested_weight,
        target_duration=payload.target_duration,
        difficulty_level=payload.difficulty_level,
    )

    if payload.type == WorkoutType.CARDIO and payload.cardio_type_id is not None:
        _ = _get_cardio_type_or_404(db, payload.cardio_type_id)

    muscle_groups = _get_muscle_groups_or_404(db, payload.muscle_group_ids)

    workout = Workout(
        id=uuid4(),
        name=payload.name,
        description=payload.description,
        instructions=payload.instructions,
        type=payload.type,
        cardio_type_id=payload.cardio_type_id,
        target_sets=payload.target_sets,
        target_reps=payload.target_reps,
        suggested_weight=payload.suggested_weight,
        target_duration=payload.target_duration,
        difficulty_level=payload.difficulty_level,
        is_archived=False,
    )
    workout.muscle_groups = muscle_groups

    db.add(workout)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        logger.exception("Failed creating workout %s", payload.name)
        raise WorkoutServiceError("Unable to create workout.", 500) from exc

    db.refresh(workout)
    workout = _get_workout_or_404(db, workout.id)
    return _to_workout_response(workout)


def update_workout(db: Session, workout_id: UUID, payload: WorkoutUpdateRequest) -> WorkoutResponse:
    workout = _get_workout_or_404(db, workout_id)
    updates = payload.model_dump(exclude_unset=True)

    if "name" in updates:
        existing = db.scalar(
            select(Workout.id).where(
                func.lower(Workout.name) == str(updates["name"]).lower(),
                Workout.id != workout.id,
            )
        )
        if existing is not None:
            raise WorkoutServiceError("A workout with this name already exists.", 409)

    next_type = updates.get("type", workout.type)
    next_cardio_type_id = updates.get("cardio_type_id", workout.cardio_type_id)
    next_target_sets = updates.get("target_sets", workout.target_sets)
    next_target_reps = updates.get("target_reps", workout.target_reps)
    next_suggested_weight = updates.get("suggested_weight", workout.suggested_weight)
    next_target_duration = updates.get("target_duration", workout.target_duration)
    next_difficulty_level = updates.get("difficulty_level", workout.difficulty_level)

    if next_type == WorkoutType.STRENGTH:
        next_cardio_type_id = None
        next_target_duration = None
        next_difficulty_level = None
    else:
        next_target_sets = None
        next_target_reps = None
        next_suggested_weight = None

    _assert_workout_fields(
        workout_type=next_type,
        cardio_type_id=next_cardio_type_id,
        target_sets=next_target_sets,
        target_reps=next_target_reps,
        suggested_weight=next_suggested_weight,
        target_duration=next_target_duration,
        difficulty_level=next_difficulty_level,
    )

    if next_type == WorkoutType.CARDIO and next_cardio_type_id is not None:
        _ = _get_cardio_type_or_404(db, next_cardio_type_id)

    workout.name = updates.get("name", workout.name)
    workout.description = updates.get("description", workout.description)
    workout.instructions = updates.get("instructions", workout.instructions)
    workout.type = next_type
    workout.cardio_type_id = next_cardio_type_id
    workout.target_sets = next_target_sets
    workout.target_reps = next_target_reps
    workout.suggested_weight = next_suggested_weight
    workout.target_duration = next_target_duration
    workout.difficulty_level = next_difficulty_level

    if "muscle_group_ids" in updates:
        muscle_group_ids = updates["muscle_group_ids"] or []
        if not muscle_group_ids:
            raise WorkoutServiceError("At least one muscle group is required.", 400)
        workout.muscle_groups = _get_muscle_groups_or_404(db, muscle_group_ids)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        logger.exception("Failed updating workout %s", workout.id)
        raise WorkoutServiceError("Unable to update workout.", 500) from exc

    db.refresh(workout)
    workout = _get_workout_or_404(db, workout.id)
    return _to_workout_response(workout)


def count_active_plan_dependencies(db: Session, workout_id: UUID) -> int:
    count = db.scalar(
        select(func.count(func.distinct(WorkoutPlan.id)))
        .join(PlanDay, PlanDay.plan_id == WorkoutPlan.id)
        .join(PlanDayWorkout, PlanDayWorkout.plan_day_id == PlanDay.id)
        .join(PlanAssignment, PlanAssignment.plan_id == WorkoutPlan.id)
        .where(
            PlanDayWorkout.workout_id == workout_id,
            PlanAssignment.status == PlanAssignmentStatus.ACTIVE,
            WorkoutPlan.is_archived.is_(False),
        )
    )
    return int(count or 0)


def archive_workout(db: Session, workout_id: UUID) -> WorkoutArchiveResponse:
    workout = _get_workout_or_404(db, workout_id)
    if workout.is_archived:
        return WorkoutArchiveResponse(workout=_to_workout_response(workout), active_plan_count=0)

    active_plan_count = count_active_plan_dependencies(db, workout.id)
    if active_plan_count > 0:
        raise WorkoutServiceError(
            f"Cannot archive workout because it is used by {active_plan_count} active plans.",
            409,
        )

    workout.is_archived = True
    try:
        db.commit()
    except Exception as exc:  # noqa: BLE001
        db.rollback()
        logger.exception("Failed archiving workout %s", workout.id)
        raise WorkoutServiceError("Unable to archive workout.", 500) from exc

    db.refresh(workout)
    workout = _get_workout_or_404(db, workout.id)
    return WorkoutArchiveResponse(workout=_to_workout_response(workout), active_plan_count=0)


def unarchive_workout(db: Session, workout_id: UUID) -> WorkoutResponse:
    workout = _get_workout_or_404(db, workout_id)
    if not workout.is_archived:
        return _to_workout_response(workout)

    workout.is_archived = False
    try:
        db.commit()
    except Exception as exc:  # noqa: BLE001
        db.rollback()
        logger.exception("Failed unarchiving workout %s", workout.id)
        raise WorkoutServiceError("Unable to unarchive workout.", 500) from exc

    db.refresh(workout)
    workout = _get_workout_or_404(db, workout.id)
    return _to_workout_response(workout)


def list_muscle_groups(db: Session) -> list[MuscleGroupResponse]:
    rows = db.scalars(select(MuscleGroup).order_by(MuscleGroup.name.asc())).all()
    return [MuscleGroupResponse.model_validate(row) for row in rows]


def create_muscle_group(db: Session, payload: MuscleGroupCreateRequest) -> MuscleGroupResponse:
    existing = db.scalar(
        select(MuscleGroup.id).where(func.lower(MuscleGroup.name) == payload.name.lower())
    )
    if existing is not None:
        raise WorkoutServiceError("A muscle group with this name already exists.", 409)

    group = MuscleGroup(id=uuid4(), name=payload.name, icon=payload.icon, is_default=False)
    db.add(group)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        logger.exception("Failed creating muscle group %s", payload.name)
        raise WorkoutServiceError("Unable to create muscle group.", 500) from exc

    db.refresh(group)
    return MuscleGroupResponse.model_validate(group)


def list_cardio_types(db: Session) -> list[CardioTypeResponse]:
    rows = db.scalars(select(CardioType).order_by(CardioType.name.asc())).all()
    return [CardioTypeResponse.model_validate(row) for row in rows]
