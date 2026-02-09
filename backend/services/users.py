"""Admin user management service logic."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import supabase_admin
from models.enums import UserRole
from models.user import CoachUserAssignment, User
from models.workout import Workout
from schemas.users import (
    AdminOverviewResponse,
    CoachAssignmentResponse,
    CoachSummaryResponse,
    PaginatedUsersResponse,
    UserCreateRequest,
    UserDetailResponse,
    UserListItemResponse,
    UserListQuery,
    UserResponse,
    UserUpdateRequest,
)
from services.user_support import (
    UserServiceError,
    extract_auth_user_id,
    sync_supabase_user,
    to_coach_summary,
    to_user_response,
)

logger = logging.getLogger(__name__)

MAX_USERS_PER_COACH = 50


def _get_user_or_404(db: Session, user_id: UUID) -> User:
    user = db.scalar(select(User).where(User.id == user_id))
    if user is None:
        raise UserServiceError("User not found.", 404)
    return user


def _get_assigned_coaches(db: Session, user_id: UUID) -> list[CoachSummaryResponse]:
    coaches = (
        db.scalars(
            select(User)
            .join(CoachUserAssignment, CoachUserAssignment.coach_id == User.id)
            .where(CoachUserAssignment.user_id == user_id)
            .order_by(User.name.asc())
        )
        .unique()
        .all()
    )
    return [to_coach_summary(coach) for coach in coaches]


def _assert_role_transition_allowed(db: Session, user: User, next_role: UserRole) -> None:
    if user.role == next_role:
        return

    assigned_as_coach_count = db.scalar(
        select(func.count(CoachUserAssignment.id)).where(CoachUserAssignment.coach_id == user.id)
    )
    assigned_as_user_count = db.scalar(
        select(func.count(CoachUserAssignment.id)).where(CoachUserAssignment.user_id == user.id)
    )

    if assigned_as_coach_count and next_role != UserRole.COACH:
        raise UserServiceError(
            "Cannot change role while this coach still has assigned users.",
            409,
        )

    if assigned_as_user_count and next_role != UserRole.USER:
        raise UserServiceError(
            "Cannot change role while this user still has coach assignments.",
            409,
        )


def list_users(db: Session, query: UserListQuery) -> PaginatedUsersResponse:
    filters = []
    if query.role is not None:
        filters.append(User.role == query.role)
    if query.is_active is not None:
        filters.append(User.is_active.is_(query.is_active))
    if query.search:
        search_value = f"%{query.search.lower()}%"
        filters.append(
            or_(
                func.lower(User.name).like(search_value),
                func.lower(User.email).like(search_value),
            )
        )

    total = db.scalar(select(func.count(User.id)).where(*filters)) or 0
    offset = (query.page - 1) * query.page_size

    users = (
        db.scalars(
            select(User)
            .where(*filters)
            .order_by(User.created_at.desc())
            .offset(offset)
            .limit(query.page_size)
        )
        .unique()
        .all()
    )

    coach_count_by_user_id: dict[UUID, int] = {}
    user_ids = [user.id for user in users]
    if user_ids:
        coach_counts = db.execute(
            select(
                CoachUserAssignment.user_id,
                func.count(CoachUserAssignment.coach_id),
            )
            .where(CoachUserAssignment.user_id.in_(user_ids))
            .group_by(CoachUserAssignment.user_id)
        ).all()
        coach_count_by_user_id = {row[0]: int(row[1]) for row in coach_counts}

    items = [
        UserListItemResponse(
            **to_user_response(user).model_dump(),
            coach_count=coach_count_by_user_id.get(user.id, 0),
        )
        for user in users
    ]

    total_pages = (total + query.page_size - 1) // query.page_size if total else 0
    return PaginatedUsersResponse(
        items=items,
        page=query.page,
        page_size=query.page_size,
        total=total,
        total_pages=total_pages,
    )


def get_user_detail(db: Session, user_id: UUID) -> UserDetailResponse:
    user = _get_user_or_404(db, user_id)
    coaches = _get_assigned_coaches(db, user.id)
    return UserDetailResponse(**to_user_response(user).model_dump(), coaches=coaches)


def create_user(db: Session, payload: UserCreateRequest) -> UserResponse:
    existing_user = db.scalar(select(User).where(User.email == payload.email))
    if existing_user is not None:
        raise UserServiceError("A user with this email already exists.", 409)

    try:
        auth_result = supabase_admin.auth.admin.create_user(
            {
                "email": payload.email,
                "password": payload.password,
                "email_confirm": True,
                "user_metadata": {
                    "name": payload.name,
                    "role": payload.role.value,
                },
            }
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed creating auth user for %s", payload.email)
        raise UserServiceError("Unable to create user in authentication provider.", 400) from exc

    auth_user_id = extract_auth_user_id(auth_result)

    user = User(
        id=auth_user_id,
        name=payload.name,
        email=payload.email,
        role=payload.role,
        is_active=True,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        logger.exception("Failed creating local user %s", auth_user_id)
        try:
            supabase_admin.auth.admin.delete_user(str(auth_user_id))
        except Exception:  # noqa: BLE001
            logger.exception(
                "Failed cleanup of auth user %s after local insert failure", auth_user_id
            )
        raise UserServiceError("Unable to create local user profile.", 500) from exc

    db.refresh(user)
    return to_user_response(user)


def update_user(db: Session, user_id: UUID, payload: UserUpdateRequest) -> UserResponse:
    user = _get_user_or_404(db, user_id)

    next_name = payload.name if payload.name is not None else user.name
    next_email = payload.email if payload.email is not None else user.email
    next_role = payload.role if payload.role is not None else user.role

    if next_email != user.email:
        existing_user = db.scalar(select(User).where(User.email == next_email, User.id != user.id))
        if existing_user is not None:
            raise UserServiceError("A user with this email already exists.", 409)

    _assert_role_transition_allowed(db, user, next_role)

    previous_name = user.name
    previous_email = user.email
    previous_role = user.role

    if previous_email != next_email or previous_name != next_name or previous_role != next_role:
        sync_supabase_user(
            user.id,
            email=next_email if previous_email != next_email else None,
            name=next_name if previous_name != next_name else None,
            role=next_role if previous_role != next_role else None,
        )

    user.name = next_name
    user.email = next_email
    user.role = next_role

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        logger.exception("Failed updating local user %s", user_id)
        try:
            sync_supabase_user(
                user.id,
                email=previous_email,
                name=previous_name,
                role=previous_role,
            )
        except UserServiceError:
            logger.exception("Failed rolling back auth user sync for %s", user_id)
        raise UserServiceError("Unable to update user.", 500) from exc

    db.refresh(user)
    return to_user_response(user)


def deactivate_user(db: Session, user_id: UUID, actor_user_id: UUID) -> UserResponse:
    user = _get_user_or_404(db, user_id)
    if user.id == actor_user_id:
        raise UserServiceError("You cannot deactivate your own account.", 400)

    if not user.is_active:
        return to_user_response(user)

    user.is_active = False
    user.deactivated_at = datetime.now(timezone.utc)
    try:
        db.commit()
    except Exception as exc:  # noqa: BLE001
        db.rollback()
        logger.exception("Failed deactivating user %s", user_id)
        raise UserServiceError("Unable to deactivate user.", 500) from exc

    db.refresh(user)
    return to_user_response(user)


def assign_coaches_to_user(
    db: Session,
    user_id: UUID,
    coach_ids: list[UUID],
    assigned_by_user_id: UUID,
) -> CoachAssignmentResponse:
    target_user = _get_user_or_404(db, user_id)
    if target_user.role != UserRole.USER:
        raise UserServiceError("Coaches can only be assigned to users with role 'user'.", 400)
    if not target_user.is_active:
        raise UserServiceError("Cannot assign coaches to a deactivated user.", 400)

    unique_coach_ids = list(dict.fromkeys(coach_ids))
    if not unique_coach_ids:
        return CoachAssignmentResponse(user_id=user_id, coaches=_get_assigned_coaches(db, user_id))

    coaches = db.scalars(select(User).where(User.id.in_(unique_coach_ids))).unique().all()
    coach_map = {coach.id: coach for coach in coaches}
    missing_coach_ids = [coach_id for coach_id in unique_coach_ids if coach_id not in coach_map]
    if missing_coach_ids:
        raise UserServiceError("One or more selected coaches were not found.", 404)

    for coach in coaches:
        if coach.role != UserRole.COACH:
            raise UserServiceError(f"{coach.name} is not a coach.", 400)
        if not coach.is_active:
            raise UserServiceError(f"{coach.name} is deactivated and cannot be assigned.", 400)

    existing_assignment_ids = set(
        db.scalars(
            select(CoachUserAssignment.coach_id).where(
                CoachUserAssignment.user_id == user_id,
                CoachUserAssignment.coach_id.in_(unique_coach_ids),
            )
        ).all()
    )
    pending_insert_ids = [
        coach_id for coach_id in unique_coach_ids if coach_id not in existing_assignment_ids
    ]

    for coach_id in pending_insert_ids:
        assigned_count = db.scalar(
            select(func.count(CoachUserAssignment.id)).where(
                CoachUserAssignment.coach_id == coach_id
            )
        )
        if assigned_count and int(assigned_count) >= MAX_USERS_PER_COACH:
            coach_name = coach_map[coach_id].name
            raise UserServiceError(
                f"{coach_name} already has {MAX_USERS_PER_COACH} assigned users.",
                400,
            )

    for coach_id in pending_insert_ids:
        db.add(
            CoachUserAssignment(
                coach_id=coach_id,
                user_id=user_id,
                assigned_by=assigned_by_user_id,
            )
        )

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        logger.exception("Failed assigning coaches to user %s", user_id)
        raise UserServiceError(
            "Unable to assign coaches. Verify coach limits and assignments.",
            400,
        ) from exc

    return CoachAssignmentResponse(user_id=user_id, coaches=_get_assigned_coaches(db, user_id))


def remove_coach_assignment(db: Session, user_id: UUID, coach_id: UUID) -> CoachAssignmentResponse:
    _ = _get_user_or_404(db, user_id)
    assignment = db.scalar(
        select(CoachUserAssignment).where(
            CoachUserAssignment.user_id == user_id,
            CoachUserAssignment.coach_id == coach_id,
        )
    )
    if assignment is None:
        raise UserServiceError("Coach assignment not found.", 404)

    db.delete(assignment)
    try:
        db.commit()
    except Exception as exc:  # noqa: BLE001
        db.rollback()
        logger.exception("Failed removing coach assignment user=%s coach=%s", user_id, coach_id)
        raise UserServiceError("Unable to remove coach assignment.", 500) from exc

    return CoachAssignmentResponse(user_id=user_id, coaches=_get_assigned_coaches(db, user_id))


def get_admin_overview(db: Session) -> AdminOverviewResponse:
    total_users = db.scalar(select(func.count(User.id)).where(User.role == UserRole.USER)) or 0
    total_coaches = db.scalar(select(func.count(User.id)).where(User.role == UserRole.COACH)) or 0
    total_workouts = db.scalar(select(func.count(Workout.id))) or 0
    active_users = db.scalar(select(func.count(User.id)).where(User.is_active.is_(True))) or 0
    inactive_users = db.scalar(select(func.count(User.id)).where(User.is_active.is_(False))) or 0

    return AdminOverviewResponse(
        total_users=int(total_users),
        total_coaches=int(total_coaches),
        total_workouts=int(total_workouts),
        active_users=int(active_users),
        inactive_users=int(inactive_users),
    )
