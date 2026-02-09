"""User management API routes."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db_session
from core.permissions import AuthenticatedUser, get_current_user, require_role
from models.enums import UserRole
from schemas.users import (
    AdminOverviewResponse,
    CoachAssignmentRequest,
    CoachAssignmentResponse,
    PaginatedUsersResponse,
    UserCreateRequest,
    UserDetailResponse,
    UserListQuery,
    UserResponse,
    UserUpdateRequest,
)
from services.users import (
    UserServiceError,
    assign_coaches_to_user,
    create_user,
    deactivate_user,
    get_admin_overview,
    get_user_detail,
    list_users,
    remove_coach_assignment,
    update_user,
)

router = APIRouter(prefix="/users", tags=["users"])


def _to_http_exception(exc: UserServiceError) -> HTTPException:
    return HTTPException(status_code=exc.status_code, detail=exc.detail)


def _list_query_params(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    role: UserRole | None = None,
    search: str | None = Query(default=None, max_length=320),
    is_active: bool | None = None,
) -> UserListQuery:
    return UserListQuery(
        page=page,
        page_size=page_size,
        role=role,
        search=search,
        is_active=is_active,
    )


@router.get("/overview", response_model=AdminOverviewResponse)
@require_role([UserRole.ADMIN])
def overview(
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> AdminOverviewResponse:
    _ = current_user
    try:
        return get_admin_overview(db)
    except UserServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.get("", response_model=PaginatedUsersResponse)
@require_role([UserRole.ADMIN])
def get_users(
    query: UserListQuery = Depends(_list_query_params),
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> PaginatedUsersResponse:
    _ = current_user
    try:
        return list_users(db=db, query=query)
    except UserServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.get("/{user_id}", response_model=UserDetailResponse)
@require_role([UserRole.ADMIN])
def get_user(
    user_id: UUID,
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> UserDetailResponse:
    _ = current_user
    try:
        return get_user_detail(db=db, user_id=user_id)
    except UserServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=UserResponse,
)
@require_role([UserRole.ADMIN])
def post_user(
    payload: UserCreateRequest,
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> UserResponse:
    _ = current_user
    try:
        return create_user(db=db, payload=payload)
    except UserServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.put("/{user_id}", response_model=UserResponse)
@require_role([UserRole.ADMIN])
def put_user(
    user_id: UUID,
    payload: UserUpdateRequest,
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> UserResponse:
    _ = current_user
    try:
        return update_user(db=db, user_id=user_id, payload=payload)
    except UserServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.delete("/{user_id}", response_model=UserResponse)
@require_role([UserRole.ADMIN])
def delete_user(
    user_id: UUID,
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> UserResponse:
    try:
        return deactivate_user(db=db, user_id=user_id, actor_user_id=current_user.id)
    except UserServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.post("/{user_id}/coaches", response_model=CoachAssignmentResponse)
@require_role([UserRole.ADMIN])
def post_user_coaches(
    user_id: UUID,
    payload: CoachAssignmentRequest,
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> CoachAssignmentResponse:
    try:
        return assign_coaches_to_user(
            db=db,
            user_id=user_id,
            coach_ids=payload.coach_ids,
            assigned_by_user_id=current_user.id,
        )
    except UserServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.delete("/{user_id}/coaches/{coach_id}", response_model=CoachAssignmentResponse)
@require_role([UserRole.ADMIN])
def delete_user_coach(
    user_id: UUID,
    coach_id: UUID,
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> CoachAssignmentResponse:
    _ = current_user
    try:
        return remove_coach_assignment(db=db, user_id=user_id, coach_id=coach_id)
    except UserServiceError as exc:
        raise _to_http_exception(exc) from exc
