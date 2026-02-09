"""JWT verification middleware plus RBAC helpers and decorators."""

from __future__ import annotations

import inspect
from dataclasses import dataclass
from functools import wraps
from typing import Any, Callable, Sequence
from uuid import UUID

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse, Response

from app.database import get_db_session
from models.enums import UserRole
from services.auth import AuthServiceError, get_user_profile, verify_access_token

http_bearer = HTTPBearer(auto_error=False)


@dataclass(slots=True)
class AuthenticatedUser:
    id: UUID
    email: str
    name: str
    role: UserRole


class JWTVerificationMiddleware(BaseHTTPMiddleware):
    """Verifies bearer JWTs and stores token claims on request state."""

    async def dispatch(self, request: Request, call_next: Callable[..., Any]) -> Response:
        request.state.auth_token_user_id = None
        request.state.auth_token_email = None

        token = _extract_bearer_token(request.headers.get("authorization"))
        if token is None:
            return await call_next(request)

        try:
            verified = verify_access_token(token)
        except AuthServiceError as exc:
            return JSONResponse(
                status_code=exc.status_code,
                content={"detail": exc.detail},
            )

        request.state.auth_token_user_id = verified.user_id
        request.state.auth_token_email = verified.email
        return await call_next(request)


def _extract_bearer_token(raw_header: str | None) -> str | None:
    if raw_header is None:
        return None

    header = raw_header.strip()
    if not header:
        return None

    scheme, _, token = header.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        return None

    return token.strip()


async def get_current_user(
    request: Request,
    db: Session = Depends(get_db_session),
    credentials: HTTPAuthorizationCredentials | None = Depends(http_bearer),
) -> AuthenticatedUser:
    token_user_id = getattr(request.state, "auth_token_user_id", None)
    token_email = getattr(request.state, "auth_token_email", None)

    if token_user_id is None:
        if credentials is None or credentials.scheme.lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing Bearer token.",
            )

        try:
            verified = verify_access_token(credentials.credentials)
        except AuthServiceError as exc:
            raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc

        token_user_id = verified.user_id
        token_email = verified.email

    try:
        user = get_user_profile(db, token_user_id)
    except AuthServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc

    return AuthenticatedUser(
        id=user.id,
        email=user.email or token_email or "",
        name=user.name,
        role=user.role,
    )


def _normalize_roles(allowed_roles: Sequence[str | UserRole]) -> set[UserRole]:
    normalized: set[UserRole] = set()
    for role in allowed_roles:
        if isinstance(role, UserRole):
            normalized.add(role)
            continue
        normalized.add(UserRole(role))
    if not normalized:
        raise ValueError("At least one role is required.")
    return normalized


def require_role(
    allowed_roles: Sequence[str | UserRole],
) -> Callable[[Callable[..., Any]], Callable[..., Any]]:
    """Decorator for role-gated endpoints.

    Wrapped endpoint must include `current_user: AuthenticatedUser = Depends(get_current_user)`.
    """

    normalized_roles = _normalize_roles(allowed_roles)

    def decorator(endpoint: Callable[..., Any]) -> Callable[..., Any]:
        endpoint_signature = inspect.signature(endpoint)

        if inspect.iscoroutinefunction(endpoint):

            @wraps(endpoint)
            async def async_wrapper(*args: Any, **kwargs: Any) -> Any:
                current_user = kwargs.get("current_user")
                if not isinstance(current_user, AuthenticatedUser):
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Route missing current_user dependency.",
                    )
                if current_user.role not in normalized_roles:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="You do not have permission to access this resource.",
                    )
                return await endpoint(*args, **kwargs)

            async_wrapper.__signature__ = endpoint_signature  # type: ignore[attr-defined]
            return async_wrapper

        @wraps(endpoint)
        def sync_wrapper(*args: Any, **kwargs: Any) -> Any:
            current_user = kwargs.get("current_user")
            if not isinstance(current_user, AuthenticatedUser):
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Route missing current_user dependency.",
                )
            if current_user.role not in normalized_roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to access this resource.",
                )
            return endpoint(*args, **kwargs)

        sync_wrapper.__signature__ = endpoint_signature  # type: ignore[attr-defined]
        return sync_wrapper

    return decorator
