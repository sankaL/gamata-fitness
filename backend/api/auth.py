"""Authentication API routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db_session
from core.permissions import AuthenticatedUser, get_current_user
from schemas.auth import (
    AuthResponse,
    LoginRequest,
    MessageResponse,
    PasswordResetRequest,
    PasswordUpdateRequest,
    RegisterRequest,
    UserResponse,
)
from services.auth import (
    AuthServiceError,
    get_user_profile,
    login_user,
    register_user,
    send_password_reset,
    update_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])
http_bearer = HTTPBearer(auto_error=False)


def _to_http_exception(exc: AuthServiceError) -> HTTPException:
    return HTTPException(status_code=exc.status_code, detail=exc.detail)


def _default_password_reset_redirect() -> str:
    frontend_origin = settings.cors_origins[0].rstrip("/")
    return f"{frontend_origin}/auth/update-password"


@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    response_model=AuthResponse,
)
def register(
    payload: RegisterRequest,
    db: Session = Depends(get_db_session),
) -> AuthResponse:
    try:
        return register_user(db=db, payload=payload)
    except AuthServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.post("/login", response_model=AuthResponse)
def login(
    payload: LoginRequest,
    db: Session = Depends(get_db_session),
) -> AuthResponse:
    try:
        return login_user(db=db, payload=payload)
    except AuthServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.get("/me", response_model=UserResponse)
def me(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> UserResponse:
    try:
        return UserResponse.model_validate(get_user_profile(db=db, user_id=current_user.id))
    except AuthServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.post("/password-reset", response_model=MessageResponse)
def password_reset(payload: PasswordResetRequest) -> MessageResponse:
    request_payload = payload
    if payload.redirect_to is None:
        request_payload = PasswordResetRequest(
            email=payload.email,
            redirect_to=_default_password_reset_redirect(),
        )

    try:
        return send_password_reset(request_payload)
    except AuthServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.post("/password-update", response_model=MessageResponse)
def password_update(
    payload: PasswordUpdateRequest,
    credentials: HTTPAuthorizationCredentials | None = Depends(http_bearer),
) -> MessageResponse:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Bearer token.",
        )

    try:
        return update_password(access_token=credentials.credentials, payload=payload)
    except AuthServiceError as exc:
        raise _to_http_exception(exc) from exc
