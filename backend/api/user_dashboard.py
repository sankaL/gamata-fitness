"""User dashboard API routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db_session
from core.permissions import AuthenticatedUser, get_current_user, require_role
from models.enums import UserRole
from schemas.dashboard import (
    UserCoachesResponse,
    UserQuickStatsResponse,
    UserTodayWorkoutResponse,
    UserWeekPlanResponse,
)
from services.user_dashboard import (
    UserDashboardServiceError,
    get_user_coaches,
    get_user_current_week_plan,
    get_user_quick_stats,
    get_user_today_workout,
)

router = APIRouter(prefix="/users/me", tags=["user-dashboard"])


def _to_http_exception(exc: UserDashboardServiceError) -> HTTPException:
    return HTTPException(status_code=exc.status_code, detail=exc.detail)


@router.get("/today", response_model=UserTodayWorkoutResponse)
@require_role([UserRole.USER])
def get_today_workout(
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> UserTodayWorkoutResponse:
    try:
        return get_user_today_workout(db=db, user_id=current_user.id)
    except UserDashboardServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.get("/plan", response_model=UserWeekPlanResponse)
@require_role([UserRole.USER])
def get_current_week_plan(
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> UserWeekPlanResponse:
    try:
        return get_user_current_week_plan(db=db, user_id=current_user.id)
    except UserDashboardServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.get("/stats", response_model=UserQuickStatsResponse)
@require_role([UserRole.USER])
def get_quick_stats(
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> UserQuickStatsResponse:
    try:
        return get_user_quick_stats(db=db, user_id=current_user.id)
    except UserDashboardServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.get("/coaches", response_model=UserCoachesResponse)
@require_role([UserRole.USER])
def get_my_coaches(
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> UserCoachesResponse:
    try:
        return get_user_coaches(db=db, user_id=current_user.id)
    except UserDashboardServiceError as exc:
        raise _to_http_exception(exc) from exc
