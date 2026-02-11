"""Plan activation API routes for user-side pending assignments."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db_session
from core.permissions import AuthenticatedUser, get_current_user, require_role
from models.enums import UserRole
from schemas.plan_activation import (
    PlanAssignmentActionResponse,
    UserPendingPlansResponse,
)
from services.plan_activation import (
    PlanActivationServiceError,
    activate_pending_plan_assignment,
    decline_pending_plan_assignment,
    get_user_pending_plan_assignments,
)

router = APIRouter(tags=["plan-activation"])


def _to_http_exception(exc: PlanActivationServiceError) -> HTTPException:
    return HTTPException(status_code=exc.status_code, detail=exc.detail)


@router.get("/users/me/pending-plans", response_model=UserPendingPlansResponse)
@require_role([UserRole.USER])
def get_pending_plans(
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> UserPendingPlansResponse:
    try:
        return get_user_pending_plan_assignments(db=db, user_id=current_user.id)
    except PlanActivationServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.post(
    "/plan-assignments/{assignment_id}/activate",
    response_model=PlanAssignmentActionResponse,
)
@require_role([UserRole.USER])
def post_activate_pending_plan(
    assignment_id: UUID,
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> PlanAssignmentActionResponse:
    try:
        return activate_pending_plan_assignment(
            db=db,
            user_id=current_user.id,
            assignment_id=assignment_id,
        )
    except PlanActivationServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.post(
    "/plan-assignments/{assignment_id}/decline",
    response_model=PlanAssignmentActionResponse,
)
@require_role([UserRole.USER])
def post_decline_pending_plan(
    assignment_id: UUID,
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> PlanAssignmentActionResponse:
    try:
        return decline_pending_plan_assignment(
            db=db,
            user_id=current_user.id,
            assignment_id=assignment_id,
        )
    except PlanActivationServiceError as exc:
        raise _to_http_exception(exc) from exc
