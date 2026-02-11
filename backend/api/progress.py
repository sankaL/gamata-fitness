"""Progress and analytics API routes."""

from __future__ import annotations

from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db_session
from core.permissions import AuthenticatedUser, get_current_user, require_role
from models.enums import UserRole, WorkoutType
from schemas.progress import (
    FrequencyProgressQuery,
    FrequencyProgressResponse,
    MuscleGroupProgressResponse,
    PaginatedUserSessionsResponse,
    ProgressDateRangeQuery,
    UserSessionHistoryQuery,
)
from services.progress import (
    ProgressServiceError,
    get_frequency_progress,
    get_muscle_group_progress,
    list_user_sessions,
)

router = APIRouter(prefix="/users/me", tags=["progress"])


def _to_http_exception(exc: ProgressServiceError) -> HTTPException:
    return HTTPException(status_code=exc.status_code, detail=exc.detail)


def _session_history_query(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    start_date: date | None = None,
    end_date: date | None = None,
    workout_type: WorkoutType | None = None,
    muscle_group_id: UUID | None = None,
) -> UserSessionHistoryQuery:
    return UserSessionHistoryQuery(
        page=page,
        page_size=page_size,
        start_date=start_date,
        end_date=end_date,
        workout_type=workout_type,
        muscle_group_id=muscle_group_id,
    )


def _progress_date_range_query(
    start_date: date | None = None,
    end_date: date | None = None,
) -> ProgressDateRangeQuery:
    return ProgressDateRangeQuery(start_date=start_date, end_date=end_date)


def _frequency_query(
    period: str = Query(default="weekly"),
    start_date: date | None = None,
    end_date: date | None = None,
) -> FrequencyProgressQuery:
    return FrequencyProgressQuery(period=period, start_date=start_date, end_date=end_date)


@router.get("/sessions", response_model=PaginatedUserSessionsResponse)
@require_role([UserRole.USER])
def get_my_sessions(
    query: UserSessionHistoryQuery = Depends(_session_history_query),
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> PaginatedUserSessionsResponse:
    try:
        return list_user_sessions(db=db, user_id=current_user.id, query=query)
    except ProgressServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.get("/progress/muscle-groups", response_model=MuscleGroupProgressResponse)
@require_role([UserRole.USER])
def get_muscle_group_trends(
    query: ProgressDateRangeQuery = Depends(_progress_date_range_query),
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> MuscleGroupProgressResponse:
    try:
        return get_muscle_group_progress(db=db, user_id=current_user.id, query=query)
    except ProgressServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.get("/progress/frequency", response_model=FrequencyProgressResponse)
@require_role([UserRole.USER])
def get_frequency_trends(
    query: FrequencyProgressQuery = Depends(_frequency_query),
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> FrequencyProgressResponse:
    try:
        return get_frequency_progress(db=db, user_id=current_user.id, query=query)
    except ProgressServiceError as exc:
        raise _to_http_exception(exc) from exc
