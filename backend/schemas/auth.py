"""Pydantic schemas for authentication endpoints."""

from __future__ import annotations

from datetime import datetime
from re import compile as re_compile
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from models.enums import UserRole

EMAIL_PATTERN = re_compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
MIN_PASSWORD_LENGTH = 8


class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=MIN_PASSWORD_LENGTH, max_length=128)
    role: UserRole = Field(default=UserRole.USER)

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

    @field_validator("role")
    @classmethod
    def enforce_self_signup_role(cls, value: UserRole) -> UserRole:
        if value is not UserRole.USER:
            raise ValueError("Self-registration only supports the user role.")
        return value


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=MIN_PASSWORD_LENGTH, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        cleaned = value.strip().lower()
        if not EMAIL_PATTERN.match(cleaned):
            raise ValueError("Invalid email address.")
        return cleaned


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    email: str
    role: UserRole
    created_at: datetime
    updated_at: datetime


class AuthResponse(BaseModel):
    user: UserResponse
    access_token: str | None = None
    refresh_token: str | None = None
    expires_in: int | None = None
    token_type: str = "bearer"
    requires_email_confirmation: bool = False


class PasswordResetRequest(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    redirect_to: str | None = Field(default=None, max_length=512)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        cleaned = value.strip().lower()
        if not EMAIL_PATTERN.match(cleaned):
            raise ValueError("Invalid email address.")
        return cleaned

    @field_validator("redirect_to")
    @classmethod
    def validate_redirect_to(cls, value: str | None) -> str | None:
        if value is None:
            return None

        cleaned = value.strip()
        if not cleaned:
            return None

        if not cleaned.startswith("http://") and not cleaned.startswith("https://"):
            raise ValueError("redirect_to must be an absolute http(s) URL.")

        return cleaned


class PasswordUpdateRequest(BaseModel):
    password: str = Field(min_length=MIN_PASSWORD_LENGTH, max_length=128)


class MessageResponse(BaseModel):
    message: str
