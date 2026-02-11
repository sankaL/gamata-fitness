"""Workout library API routes."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db_session
from core.permissions import AuthenticatedUser, get_current_user, require_role
from models.enums import UserRole, WorkoutType
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
from services.workouts import (
    WorkoutServiceError,
    archive_workout,
    create_muscle_group,
    create_workout,
    get_workout_detail,
    list_alternative_workouts,
    list_cardio_types,
    list_muscle_groups,
    list_workouts,
    unarchive_workout,
    update_workout,
)

router = APIRouter(tags=["workouts"])


def _to_http_exception(exc: WorkoutServiceError) -> HTTPException:
    return HTTPException(status_code=exc.status_code, detail=exc.detail)


def _list_query_params(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    type: WorkoutType | None = None,
    muscle_group_id: UUID | None = None,
    is_archived: bool | None = None,
    search: str | None = Query(default=None, max_length=160),
) -> WorkoutListQuery:
    return WorkoutListQuery(
        page=page,
        page_size=page_size,
        type=type,
        muscle_group_id=muscle_group_id,
        is_archived=is_archived,
        search=search,
    )


@router.get("/workouts", response_model=PaginatedWorkoutsResponse)
@require_role([UserRole.ADMIN, UserRole.COACH, UserRole.USER])
def get_workouts(
    query: WorkoutListQuery = Depends(_list_query_params),
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> PaginatedWorkoutsResponse:
    _ = current_user
    try:
        return list_workouts(db=db, query=query)
    except WorkoutServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.get("/workouts/{workout_id}", response_model=WorkoutResponse)
@require_role([UserRole.ADMIN, UserRole.COACH, UserRole.USER])
def get_workout(
    workout_id: UUID,
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> WorkoutResponse:
    _ = current_user
    try:
        return get_workout_detail(db=db, workout_id=workout_id)
    except WorkoutServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.get("/workouts/alternatives/{workout_id}", response_model=list[WorkoutResponse])
@require_role([UserRole.ADMIN, UserRole.COACH, UserRole.USER])
def get_workout_alternatives(
    workout_id: UUID,
    limit: int = Query(default=12, ge=1, le=50),
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> list[WorkoutResponse]:
    _ = current_user
    try:
        return list_alternative_workouts(db=db, workout_id=workout_id, limit=limit)
    except WorkoutServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.post(
    "/workouts", response_model=WorkoutResponse, status_code=status.HTTP_201_CREATED
)
@require_role([UserRole.ADMIN])
def post_workout(
    payload: WorkoutCreateRequest,
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> WorkoutResponse:
    _ = current_user
    try:
        return create_workout(db=db, payload=payload)
    except WorkoutServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.put("/workouts/{workout_id}", response_model=WorkoutResponse)
@require_role([UserRole.ADMIN])
def put_workout(
    workout_id: UUID,
    payload: WorkoutUpdateRequest,
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> WorkoutResponse:
    _ = current_user
    try:
        return update_workout(db=db, workout_id=workout_id, payload=payload)
    except WorkoutServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.post("/workouts/{workout_id}/archive", response_model=WorkoutArchiveResponse)
@require_role([UserRole.ADMIN])
def post_workout_archive(
    workout_id: UUID,
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> WorkoutArchiveResponse:
    _ = current_user
    try:
        return archive_workout(db=db, workout_id=workout_id)
    except WorkoutServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.post("/workouts/{workout_id}/unarchive", response_model=WorkoutResponse)
@require_role([UserRole.ADMIN])
def post_workout_unarchive(
    workout_id: UUID,
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> WorkoutResponse:
    _ = current_user
    try:
        return unarchive_workout(db=db, workout_id=workout_id)
    except WorkoutServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.get("/muscle-groups", response_model=list[MuscleGroupResponse])
@require_role([UserRole.ADMIN, UserRole.COACH, UserRole.USER])
def get_muscle_groups(
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> list[MuscleGroupResponse]:
    _ = current_user
    try:
        return list_muscle_groups(db=db)
    except WorkoutServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.post(
    "/muscle-groups",
    response_model=MuscleGroupResponse,
    status_code=status.HTTP_201_CREATED,
)
@require_role([UserRole.ADMIN])
def post_muscle_group(
    payload: MuscleGroupCreateRequest,
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> MuscleGroupResponse:
    _ = current_user
    try:
        return create_muscle_group(db=db, payload=payload)
    except WorkoutServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.get("/cardio-types", response_model=list[CardioTypeResponse])
@require_role([UserRole.ADMIN, UserRole.COACH, UserRole.USER])
def get_cardio_types(
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> list[CardioTypeResponse]:
    _ = current_user
    try:
        return list_cardio_types(db=db)
    except WorkoutServiceError as exc:
        raise _to_http_exception(exc) from exc
