"""Service logic for coach plan management."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from models.enums import PlanAssignmentStatus, UserRole
from models.plan import PlanAssignment, PlanDay, WorkoutPlan
from models.user import CoachUserAssignment, User
from schemas.plans import (
    CoachRosterResponse,
    CoachRosterUserResponse,
    PaginatedPlansResponse,
    PlanAssignmentResponseItem,
    PlanAssignRequest,
    PlanAssignResponse,
    PlanCreateRequest,
    PlanDetailResponse,
    PlanListItemResponse,
    PlanListQuery,
    PlanUpdateRequest,
    PlanUsersResponse,
    PlanUserStatusResponse,
)
from services.plan_support import (
    PlanServiceError,
    apply_plan_days,
    completion_percent,
    plan_workout_count,
    to_plan_detail_response,
    with_plan_relations,
)

logger = logging.getLogger(__name__)


def _get_plan_owned_by_coach_or_404(db: Session, plan_id: UUID, coach_id: UUID) -> WorkoutPlan:
    plan = db.scalar(
        select(WorkoutPlan)
        .where(WorkoutPlan.id == plan_id, WorkoutPlan.coach_id == coach_id)
        .options(*with_plan_relations())
    )
    if plan is None:
        raise PlanServiceError("Plan not found.", 404)
    return plan


def list_plans(db: Session, *, coach_id: UUID, query: PlanListQuery) -> PaginatedPlansResponse:
    filters = [WorkoutPlan.coach_id == coach_id]
    if query.is_archived is not None:
        filters.append(WorkoutPlan.is_archived.is_(query.is_archived))
    if query.search:
        search_value = f"%{query.search.lower()}%"
        filters.append(func.lower(WorkoutPlan.name).like(search_value))

    total = db.scalar(select(func.count(WorkoutPlan.id)).where(*filters)) or 0
    offset = (query.page - 1) * query.page_size

    plans = (
        db.scalars(
            select(WorkoutPlan)
            .where(*filters)
            .options(*with_plan_relations())
            .order_by(WorkoutPlan.created_at.desc())
            .offset(offset)
            .limit(query.page_size)
        )
        .unique()
        .all()
    )

    items = [
        PlanListItemResponse(
            id=plan.id,
            name=plan.name,
            coach_id=plan.coach_id,
            start_date=plan.start_date,
            end_date=plan.end_date,
            is_archived=plan.is_archived,
            archived_at=plan.archived_at,
            created_at=plan.created_at,
            updated_at=plan.updated_at,
            total_days=len(plan.days),
            total_workouts=plan_workout_count(plan),
        )
        for plan in plans
    ]

    total_pages = (total + query.page_size - 1) // query.page_size if total else 0
    return PaginatedPlansResponse(
        items=items,
        page=query.page,
        page_size=query.page_size,
        total=total,
        total_pages=total_pages,
    )


def get_plan_detail(db: Session, *, coach_id: UUID, plan_id: UUID) -> PlanDetailResponse:
    plan = _get_plan_owned_by_coach_or_404(db, plan_id=plan_id, coach_id=coach_id)
    return to_plan_detail_response(plan)


def create_plan(db: Session, *, coach_id: UUID, payload: PlanCreateRequest) -> PlanDetailResponse:
    plan = WorkoutPlan(
        id=uuid4(),
        name=payload.name,
        coach_id=coach_id,
        start_date=payload.start_date,
        end_date=payload.end_date,
        is_archived=False,
    )
    db.add(plan)
    db.flush()

    apply_plan_days(db, plan, payload.days)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        logger.exception("Failed creating plan for coach %s", coach_id)
        raise PlanServiceError("Unable to create plan.", 500) from exc

    db.refresh(plan)
    plan = _get_plan_owned_by_coach_or_404(db, plan_id=plan.id, coach_id=coach_id)
    return to_plan_detail_response(plan)


def update_plan(
    db: Session,
    *,
    coach_id: UUID,
    plan_id: UUID,
    payload: PlanUpdateRequest,
) -> PlanDetailResponse:
    plan = _get_plan_owned_by_coach_or_404(db, plan_id=plan_id, coach_id=coach_id)

    if plan.is_archived:
        raise PlanServiceError("Archived plans cannot be edited until unarchived.", 400)

    updates = payload.model_dump(exclude_unset=True)

    next_start = updates.get("start_date", plan.start_date)
    next_end = updates.get("end_date", plan.end_date)
    if next_start > next_end:
        raise PlanServiceError("Plan start date must be on or before end date.", 400)

    plan.name = updates.get("name", plan.name)
    plan.start_date = next_start
    plan.end_date = next_end

    if "days" in updates:
        apply_plan_days(db, plan, payload.days or [])

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        logger.exception("Failed updating plan %s", plan_id)
        raise PlanServiceError("Unable to update plan.", 500) from exc

    db.refresh(plan)
    plan = _get_plan_owned_by_coach_or_404(db, plan_id=plan.id, coach_id=coach_id)
    return to_plan_detail_response(plan)


def archive_plan(db: Session, *, coach_id: UUID, plan_id: UUID) -> PlanDetailResponse:
    plan = _get_plan_owned_by_coach_or_404(db, plan_id=plan_id, coach_id=coach_id)
    if plan.is_archived:
        return to_plan_detail_response(plan)

    plan.is_archived = True
    plan.archived_at = datetime.now(timezone.utc)

    try:
        db.commit()
    except Exception as exc:  # noqa: BLE001
        db.rollback()
        logger.exception("Failed archiving plan %s", plan_id)
        raise PlanServiceError("Unable to archive plan.", 500) from exc

    db.refresh(plan)
    plan = _get_plan_owned_by_coach_or_404(db, plan_id=plan.id, coach_id=coach_id)
    return to_plan_detail_response(plan)


def unarchive_plan(db: Session, *, coach_id: UUID, plan_id: UUID) -> PlanDetailResponse:
    plan = _get_plan_owned_by_coach_or_404(db, plan_id=plan_id, coach_id=coach_id)
    if not plan.is_archived:
        return to_plan_detail_response(plan)

    plan.is_archived = False
    plan.archived_at = None

    try:
        db.commit()
    except Exception as exc:  # noqa: BLE001
        db.rollback()
        logger.exception("Failed unarchiving plan %s", plan_id)
        raise PlanServiceError("Unable to unarchive plan.", 500) from exc

    db.refresh(plan)
    plan = _get_plan_owned_by_coach_or_404(db, plan_id=plan.id, coach_id=coach_id)
    return to_plan_detail_response(plan)


def assign_plan_to_users(
    db: Session,
    *,
    coach_id: UUID,
    plan_id: UUID,
    payload: PlanAssignRequest,
) -> PlanAssignResponse:
    plan = _get_plan_owned_by_coach_or_404(db, plan_id=plan_id, coach_id=coach_id)
    if plan.is_archived:
        raise PlanServiceError("Archived plans cannot be assigned.", 400)

    user_ids = payload.user_ids
    roster_ids = set(
        db.scalars(
            select(CoachUserAssignment.user_id).where(CoachUserAssignment.coach_id == coach_id)
        ).all()
    )

    for user_id in user_ids:
        if user_id not in roster_ids:
            raise PlanServiceError(
                "One or more selected users are not assigned to this coach.", 403
            )

    users = db.scalars(select(User).where(User.id.in_(user_ids))).all()
    user_map = {user.id: user for user in users}
    if len(user_map) != len(set(user_ids)):
        raise PlanServiceError("One or more selected users were not found.", 404)

    for user_id in user_ids:
        user = user_map[user_id]
        if user.role != UserRole.USER:
            raise PlanServiceError("Plans can only be assigned to users with role 'user'.", 400)
        if not user.is_active:
            raise PlanServiceError("Plans cannot be assigned to deactivated users.", 400)

    created_or_existing: list[PlanAssignment] = []

    for user_id in user_ids:
        existing_open = db.scalar(
            select(PlanAssignment)
            .where(
                PlanAssignment.plan_id == plan.id,
                PlanAssignment.user_id == user_id,
                PlanAssignment.status.in_(
                    (PlanAssignmentStatus.PENDING, PlanAssignmentStatus.ACTIVE)
                ),
            )
            .order_by(PlanAssignment.assigned_at.desc())
        )
        if existing_open is not None:
            created_or_existing.append(existing_open)
            continue

        has_active = db.scalar(
            select(func.count(PlanAssignment.id)).where(
                PlanAssignment.user_id == user_id,
                PlanAssignment.status == PlanAssignmentStatus.ACTIVE,
            )
        )
        has_active_assignment = int(has_active or 0) > 0

        assignment = PlanAssignment(
            id=uuid4(),
            plan_id=plan.id,
            user_id=user_id,
            status=(
                PlanAssignmentStatus.PENDING
                if has_active_assignment
                else PlanAssignmentStatus.ACTIVE
            ),
            activated_at=(None if has_active_assignment else datetime.now(timezone.utc)),
        )
        db.add(assignment)
        created_or_existing.append(assignment)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        logger.exception("Failed assigning plan %s to users", plan_id)
        raise PlanServiceError("Unable to assign plan to selected users.", 500) from exc

    for assignment in created_or_existing:
        db.refresh(assignment)

    items = [
        PlanAssignmentResponseItem(
            assignment_id=assignment.id,
            user_id=assignment.user_id,
            status=assignment.status,
            assigned_at=assignment.assigned_at,
            activated_at=assignment.activated_at,
            deactivated_at=assignment.deactivated_at,
        )
        for assignment in created_or_existing
    ]
    items.sort(key=lambda item: str(item.user_id))

    return PlanAssignResponse(plan_id=plan.id, assignments=items)


def get_plan_users_status(db: Session, *, coach_id: UUID, plan_id: UUID) -> PlanUsersResponse:
    plan = _get_plan_owned_by_coach_or_404(db, plan_id=plan_id, coach_id=coach_id)

    assignment_rows = db.execute(
        select(PlanAssignment, User)
        .join(User, User.id == PlanAssignment.user_id)
        .where(PlanAssignment.plan_id == plan.id)
        .order_by(PlanAssignment.assigned_at.desc())
    ).all()

    latest_by_user: dict[UUID, tuple[PlanAssignment, User]] = {}
    for assignment, user in assignment_rows:
        if assignment.user_id not in latest_by_user:
            latest_by_user[assignment.user_id] = (assignment, user)

    users = [
        PlanUserStatusResponse(
            user_id=user.id,
            user_name=user.name,
            user_email=user.email,
            status=assignment.status,
            assigned_at=assignment.assigned_at,
            activated_at=assignment.activated_at,
            deactivated_at=assignment.deactivated_at,
            weekly_completion_percent=completion_percent(db, user_id=user.id, plan=plan),
        )
        for assignment, user in latest_by_user.values()
    ]
    users.sort(key=lambda row: row.user_name.lower())

    return PlanUsersResponse(plan_id=plan.id, users=users)


def get_coach_roster(
    db: Session,
    *,
    coach_id: UUID,
    viewer_id: UUID,
    viewer_role: UserRole,
) -> CoachRosterResponse:
    if viewer_role == UserRole.COACH and viewer_id != coach_id:
        raise PlanServiceError("Coaches can only view their own roster.", 403)

    coach = db.scalar(select(User).where(User.id == coach_id))
    if coach is None or coach.role != UserRole.COACH:
        raise PlanServiceError("Coach not found.", 404)

    roster_rows = db.execute(
        select(User)
        .join(CoachUserAssignment, CoachUserAssignment.user_id == User.id)
        .where(CoachUserAssignment.coach_id == coach_id)
        .order_by(User.name.asc())
    ).all()

    users = [row[0] for row in roster_rows]
    if not users:
        return CoachRosterResponse(coach_id=coach_id, users=[])

    user_ids = [user.id for user in users]

    active_assignments = db.execute(
        select(PlanAssignment, WorkoutPlan)
        .join(WorkoutPlan, WorkoutPlan.id == PlanAssignment.plan_id)
        .where(
            PlanAssignment.user_id.in_(user_ids),
            PlanAssignment.status == PlanAssignmentStatus.ACTIVE,
        )
        .order_by(PlanAssignment.assigned_at.desc())
    ).all()
    active_by_user: dict[UUID, tuple[PlanAssignment, WorkoutPlan]] = {}
    for assignment, plan in active_assignments:
        if assignment.user_id not in active_by_user:
            active_by_user[assignment.user_id] = (assignment, plan)

    pending_counts = {
        row[0]: int(row[1])
        for row in db.execute(
            select(PlanAssignment.user_id, func.count(PlanAssignment.id))
            .where(
                PlanAssignment.user_id.in_(user_ids),
                PlanAssignment.status == PlanAssignmentStatus.PENDING,
            )
            .group_by(PlanAssignment.user_id)
        ).all()
    }

    plans_needed = {plan.id: plan for _, plan in active_by_user.values()}
    if plans_needed:
        loaded_plans = db.scalars(
            select(WorkoutPlan)
            .where(WorkoutPlan.id.in_(plans_needed.keys()))
            .options(selectinload(WorkoutPlan.days).selectinload(PlanDay.workouts))
        ).all()
        plan_map = {plan.id: plan for plan in loaded_plans}
    else:
        plan_map = {}

    completion_cache: dict[tuple[UUID, UUID], float] = {}

    roster = []
    for user in users:
        active_assignment = active_by_user.get(user.id)
        if active_assignment is not None:
            assignment, active_plan = active_assignment
            hydrated_plan = plan_map.get(active_plan.id, active_plan)
            cache_key = (user.id, hydrated_plan.id)
            if cache_key not in completion_cache:
                completion_cache[cache_key] = completion_percent(
                    db,
                    user_id=user.id,
                    plan=hydrated_plan,
                )
            weekly_completion_percent = completion_cache[cache_key]
            active_plan_id = hydrated_plan.id
            active_plan_name = hydrated_plan.name
            active_status = assignment.status
        else:
            weekly_completion_percent = 0.0
            active_plan_id = None
            active_plan_name = None
            active_status = None

        roster.append(
            CoachRosterUserResponse(
                user_id=user.id,
                user_name=user.name,
                user_email=user.email,
                active_plan_id=active_plan_id,
                active_plan_name=active_plan_name,
                active_plan_status=active_status,
                pending_plan_count=pending_counts.get(user.id, 0),
                weekly_completion_percent=weekly_completion_percent,
            )
        )

    return CoachRosterResponse(coach_id=coach_id, users=roster)
