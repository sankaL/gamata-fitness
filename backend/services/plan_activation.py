"""Service logic for user-side pending plan activation workflows."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from models.enums import PlanAssignmentStatus
from models.plan import PlanAssignment, PlanDay, WorkoutPlan
from models.user import User
from models.workout import Workout
from schemas.plan_activation import (
    ActivePlanSummaryResponse,
    PendingPlanAssignmentResponse,
    PlanAssignmentActionResponse,
    UserPendingPlansResponse,
)

logger = logging.getLogger(__name__)


class PlanActivationServiceError(Exception):
    """Raised for client-safe plan activation errors."""

    def __init__(self, detail: str, status_code: int) -> None:
        super().__init__(detail)
        self.detail = detail
        self.status_code = status_code


def _with_assignment_relations() -> tuple:
    return (
        selectinload(PlanAssignment.plan)
        .selectinload(WorkoutPlan.days)
        .selectinload(PlanDay.workouts)
        .selectinload(Workout.muscle_groups),
        selectinload(PlanAssignment.plan).selectinload(WorkoutPlan.coach),
    )


def _assignment_workout_count(assignment: PlanAssignment) -> int:
    if assignment.plan is None:
        return 0
    return sum(len(day.workouts) for day in assignment.plan.days)


def get_user_pending_plan_assignments(
    db: Session,
    *,
    user_id: UUID,
) -> UserPendingPlansResponse:
    active_assignment = db.scalar(
        select(PlanAssignment)
        .join(WorkoutPlan, WorkoutPlan.id == PlanAssignment.plan_id)
        .where(
            PlanAssignment.user_id == user_id,
            PlanAssignment.status == PlanAssignmentStatus.ACTIVE,
            WorkoutPlan.is_archived.is_(False),
        )
        .options(selectinload(PlanAssignment.plan))
        .order_by(PlanAssignment.activated_at.desc(), PlanAssignment.assigned_at.desc())
    )

    pending_assignments = (
        db.scalars(
            select(PlanAssignment)
            .join(WorkoutPlan, WorkoutPlan.id == PlanAssignment.plan_id)
            .where(
                PlanAssignment.user_id == user_id,
                PlanAssignment.status == PlanAssignmentStatus.PENDING,
            )
            .options(*_with_assignment_relations())
            .order_by(PlanAssignment.assigned_at.desc())
        )
        .unique()
        .all()
    )

    active_plan = None
    if active_assignment is not None and active_assignment.plan is not None:
        active_plan = ActivePlanSummaryResponse(
            assignment_id=active_assignment.id,
            plan_id=active_assignment.plan_id,
            plan_name=active_assignment.plan.name,
            activated_at=active_assignment.activated_at,
        )

    items: list[PendingPlanAssignmentResponse] = []
    for assignment in pending_assignments:
        plan = assignment.plan
        if plan is None:
            continue

        coach = plan.coach or db.scalar(select(User).where(User.id == plan.coach_id))
        coach_name = coach.name if coach is not None else "Unknown Coach"

        items.append(
            PendingPlanAssignmentResponse(
                assignment_id=assignment.id,
                plan_id=plan.id,
                plan_name=plan.name,
                coach_id=plan.coach_id,
                coach_name=coach_name,
                start_date=plan.start_date,
                end_date=plan.end_date,
                total_days=len(plan.days),
                total_workouts=_assignment_workout_count(assignment),
                assigned_at=assignment.assigned_at,
                plan_is_archived=plan.is_archived,
            )
        )

    return UserPendingPlansResponse(active_plan=active_plan, pending_assignments=items)


def _get_user_assignment_or_404(
    db: Session,
    *,
    user_id: UUID,
    assignment_id: UUID,
) -> PlanAssignment:
    assignment = db.scalar(
        select(PlanAssignment)
        .where(
            PlanAssignment.id == assignment_id,
            PlanAssignment.user_id == user_id,
        )
        .options(selectinload(PlanAssignment.plan))
    )
    if assignment is None:
        raise PlanActivationServiceError("Plan assignment not found.", 404)
    return assignment


def activate_pending_plan_assignment(
    db: Session,
    *,
    user_id: UUID,
    assignment_id: UUID,
) -> PlanAssignmentActionResponse:
    assignment = _get_user_assignment_or_404(db, user_id=user_id, assignment_id=assignment_id)

    if assignment.status != PlanAssignmentStatus.PENDING:
        raise PlanActivationServiceError("Only pending plan assignments can be activated.", 400)

    plan = assignment.plan
    if plan is None:
        raise PlanActivationServiceError("Plan not found for assignment.", 404)
    if plan.is_archived:
        raise PlanActivationServiceError("Archived plans cannot be activated.", 409)

    now = datetime.now(timezone.utc)
    active_assignments = db.scalars(
        select(PlanAssignment).where(
            PlanAssignment.user_id == user_id,
            PlanAssignment.status == PlanAssignmentStatus.ACTIVE,
            PlanAssignment.id != assignment.id,
        )
    ).all()

    deactivated_assignment_ids: list[UUID] = []
    for existing in active_assignments:
        existing.status = PlanAssignmentStatus.INACTIVE
        existing.deactivated_at = now
        deactivated_assignment_ids.append(existing.id)

    assignment.status = PlanAssignmentStatus.ACTIVE
    assignment.activated_at = now
    assignment.deactivated_at = None

    try:
        db.commit()
    except Exception as exc:  # noqa: BLE001
        db.rollback()
        logger.exception("Failed activating plan assignment %s for user %s", assignment_id, user_id)
        raise PlanActivationServiceError("Unable to activate pending plan.", 500) from exc

    db.refresh(assignment)
    return PlanAssignmentActionResponse(
        assignment_id=assignment.id,
        plan_id=assignment.plan_id,
        status=assignment.status,
        activated_at=assignment.activated_at,
        deactivated_at=assignment.deactivated_at,
        deactivated_assignment_ids=deactivated_assignment_ids,
    )


def decline_pending_plan_assignment(
    db: Session,
    *,
    user_id: UUID,
    assignment_id: UUID,
) -> PlanAssignmentActionResponse:
    assignment = _get_user_assignment_or_404(db, user_id=user_id, assignment_id=assignment_id)

    if assignment.status != PlanAssignmentStatus.PENDING:
        raise PlanActivationServiceError("Only pending plan assignments can be declined.", 400)

    assignment.status = PlanAssignmentStatus.INACTIVE
    assignment.deactivated_at = datetime.now(timezone.utc)

    try:
        db.commit()
    except Exception as exc:  # noqa: BLE001
        db.rollback()
        logger.exception("Failed declining plan assignment %s for user %s", assignment_id, user_id)
        raise PlanActivationServiceError("Unable to decline pending plan.", 500) from exc

    db.refresh(assignment)
    return PlanAssignmentActionResponse(
        assignment_id=assignment.id,
        plan_id=assignment.plan_id,
        status=assignment.status,
        activated_at=assignment.activated_at,
        deactivated_at=assignment.deactivated_at,
        deactivated_assignment_ids=[],
    )
