"""Workout session API routes."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db_session
from core.permissions import AuthenticatedUser, get_current_user, require_role
from models.enums import UserRole
from schemas.sessions import (
    SessionCreateRequest,
    SessionLogCreateRequest,
    SessionLogUpdateRequest,
    SessionResponse,
    SessionUpdateRequest,
)
from services.sessions import (
    SessionServiceError,
    add_session_log,
    complete_session,
    create_session,
    get_session,
    update_session,
    update_session_log,
)

router = APIRouter(prefix="/sessions", tags=["sessions"])


def _to_http_exception(exc: SessionServiceError) -> HTTPException:
    return HTTPException(status_code=exc.status_code, detail=exc.detail)


@router.post("", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
@require_role([UserRole.USER])
def post_session(
    payload: SessionCreateRequest,
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> SessionResponse:
    try:
        return create_session(db=db, user_id=current_user.id, payload=payload)
    except SessionServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.get("/{session_id}", response_model=SessionResponse)
@require_role([UserRole.USER])
def get_session_by_id(
    session_id: UUID,
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> SessionResponse:
    try:
        return get_session(db=db, user_id=current_user.id, session_id=session_id)
    except SessionServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.put("/{session_id}", response_model=SessionResponse)
@require_role([UserRole.USER])
def put_session(
    session_id: UUID,
    payload: SessionUpdateRequest,
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> SessionResponse:
    try:
        return update_session(
            db=db,
            user_id=current_user.id,
            session_id=session_id,
            payload=payload,
        )
    except SessionServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.post("/{session_id}/complete", response_model=SessionResponse)
@require_role([UserRole.USER])
def post_session_complete(
    session_id: UUID,
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> SessionResponse:
    try:
        return complete_session(db=db, user_id=current_user.id, session_id=session_id)
    except SessionServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.post("/{session_id}/logs", response_model=SessionResponse)
@require_role([UserRole.USER])
def post_session_log(
    session_id: UUID,
    payload: SessionLogCreateRequest,
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> SessionResponse:
    try:
        return add_session_log(
            db=db,
            user_id=current_user.id,
            session_id=session_id,
            payload=payload,
        )
    except SessionServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.put("/{session_id}/logs/{log_id}", response_model=SessionResponse)
@require_role([UserRole.USER])
def put_session_log(
    session_id: UUID,
    log_id: UUID,
    payload: SessionLogUpdateRequest,
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> SessionResponse:
    try:
        return update_session_log(
            db=db,
            user_id=current_user.id,
            session_id=session_id,
            log_id=log_id,
            payload=payload,
        )
    except SessionServiceError as exc:
        raise _to_http_exception(exc) from exc
