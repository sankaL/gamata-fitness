"""Plan management API routes."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db_session
from core.permissions import AuthenticatedUser, get_current_user, require_role
from models.enums import UserRole
from schemas.plans import (
    CoachRosterResponse,
    PaginatedPlansResponse,
    PlanAssignRequest,
    PlanAssignResponse,
    PlanCreateRequest,
    PlanDetailResponse,
    PlanListQuery,
    PlanUpdateRequest,
    PlanUsersResponse,
)
from services.plans import (
    PlanServiceError,
    archive_plan,
    assign_plan_to_users,
    create_plan,
    get_coach_roster,
    get_plan_detail,
    get_plan_users_status,
    list_plans,
    unarchive_plan,
    update_plan,
)

router = APIRouter(tags=["plans"])


def _to_http_exception(exc: PlanServiceError) -> HTTPException:
    return HTTPException(status_code=exc.status_code, detail=exc.detail)


def _list_query_params(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    is_archived: bool | None = None,
    search: str | None = Query(default=None, max_length=180),
) -> PlanListQuery:
    return PlanListQuery(
        page=page,
        page_size=page_size,
        is_archived=is_archived,
        search=search,
    )


@router.get("/plans", response_model=PaginatedPlansResponse)
@require_role([UserRole.COACH])
def get_plans(
    query: PlanListQuery = Depends(_list_query_params),
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> PaginatedPlansResponse:
    try:
        return list_plans(db=db, coach_id=current_user.id, query=query)
    except PlanServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.get("/plans/{plan_id}", response_model=PlanDetailResponse)
@require_role([UserRole.COACH])
def get_plan(
    plan_id: UUID,
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> PlanDetailResponse:
    try:
        return get_plan_detail(db=db, coach_id=current_user.id, plan_id=plan_id)
    except PlanServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.post(
    "/plans", response_model=PlanDetailResponse, status_code=status.HTTP_201_CREATED
)
@require_role([UserRole.COACH])
def post_plan(
    payload: PlanCreateRequest,
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> PlanDetailResponse:
    try:
        return create_plan(db=db, coach_id=current_user.id, payload=payload)
    except PlanServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.put("/plans/{plan_id}", response_model=PlanDetailResponse)
@require_role([UserRole.COACH])
def put_plan(
    plan_id: UUID,
    payload: PlanUpdateRequest,
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> PlanDetailResponse:
    try:
        return update_plan(
            db=db,
            coach_id=current_user.id,
            plan_id=plan_id,
            payload=payload,
        )
    except PlanServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.delete("/plans/{plan_id}", response_model=PlanDetailResponse)
@require_role([UserRole.COACH])
def delete_plan(
    plan_id: UUID,
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> PlanDetailResponse:
    try:
        return archive_plan(db=db, coach_id=current_user.id, plan_id=plan_id)
    except PlanServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.post("/plans/{plan_id}/archive", response_model=PlanDetailResponse)
@require_role([UserRole.COACH])
def post_plan_archive(
    plan_id: UUID,
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> PlanDetailResponse:
    try:
        return archive_plan(db=db, coach_id=current_user.id, plan_id=plan_id)
    except PlanServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.post("/plans/{plan_id}/unarchive", response_model=PlanDetailResponse)
@require_role([UserRole.COACH])
def post_plan_unarchive(
    plan_id: UUID,
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> PlanDetailResponse:
    try:
        return unarchive_plan(db=db, coach_id=current_user.id, plan_id=plan_id)
    except PlanServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.post("/plans/{plan_id}/assign", response_model=PlanAssignResponse)
@require_role([UserRole.COACH])
def post_plan_assign(
    plan_id: UUID,
    payload: PlanAssignRequest,
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> PlanAssignResponse:
    try:
        return assign_plan_to_users(
            db=db,
            coach_id=current_user.id,
            plan_id=plan_id,
            payload=payload,
        )
    except PlanServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.get("/plans/{plan_id}/users", response_model=PlanUsersResponse)
@require_role([UserRole.COACH])
def get_plan_users(
    plan_id: UUID,
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> PlanUsersResponse:
    try:
        return get_plan_users_status(db=db, coach_id=current_user.id, plan_id=plan_id)
    except PlanServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.get("/coaches/{coach_id}/users", response_model=CoachRosterResponse)
@require_role([UserRole.ADMIN, UserRole.COACH])
def get_coach_users(
    coach_id: UUID,
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> CoachRosterResponse:
    try:
        return get_coach_roster(
            db=db,
            coach_id=coach_id,
            viewer_id=current_user.id,
            viewer_role=current_user.role,
        )
    except PlanServiceError as exc:
        raise _to_http_exception(exc) from exc
