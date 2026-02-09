"""Pydantic schemas for admin user management endpoints."""

from __future__ import annotations

from datetime import datetime
from re import compile as re_compile
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from models.enums import UserRole

EMAIL_PATTERN = re_compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
MIN_PASSWORD_LENGTH = 8


class UserCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: str = Field(min_length=3, max_length=320)
    role: UserRole
    password: str = Field(min_length=MIN_PASSWORD_LENGTH, max_length=128)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Name is required.")
        return cleaned

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        cleaned = value.strip().lower()
        if not EMAIL_PATTERN.match(cleaned):
            raise ValueError("Invalid email address.")
        return cleaned


class UserUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    email: str | None = Field(default=None, min_length=3, max_length=320)
    role: UserRole | None = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Name is required.")
        return cleaned

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip().lower()
        if not EMAIL_PATTERN.match(cleaned):
            raise ValueError("Invalid email address.")
        return cleaned


class UserListQuery(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=10, ge=1, le=100)
    role: UserRole | None = None
    search: str | None = Field(default=None, max_length=320)
    is_active: bool | None = None

    @field_validator("search")
    @classmethod
    def normalize_search(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None


class CoachSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    email: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    email: str
    role: UserRole
    is_active: bool
    deactivated_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class UserListItemResponse(UserResponse):
    coach_count: int = 0


class PaginatedUsersResponse(BaseModel):
    items: list[UserListItemResponse]
    page: int
    page_size: int
    total: int
    total_pages: int


class UserDetailResponse(UserResponse):
    coaches: list[CoachSummaryResponse] = []


class CoachAssignmentRequest(BaseModel):
    coach_ids: list[UUID] = Field(default_factory=list)


class CoachAssignmentResponse(BaseModel):
    user_id: UUID
    coaches: list[CoachSummaryResponse]


class AdminOverviewResponse(BaseModel):
    total_users: int
    total_coaches: int
    total_workouts: int
    active_users: int
    inactive_users: int
