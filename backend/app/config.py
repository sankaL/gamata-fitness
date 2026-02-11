"""Application configuration loaded from environment variables."""

from __future__ import annotations

from functools import cached_property

from pydantic import AnyHttpUrl, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = Field(default="development", alias="APP_ENV")
    app_name: str = "GamataFitness API"
    database_url: str = Field(alias="DATABASE_URL")
    supabase_url: AnyHttpUrl = Field(alias="SUPABASE_URL")
    supabase_anon_key: str = Field(alias="SUPABASE_ANON_KEY")
    supabase_service_role_key: str = Field(alias="SUPABASE_SERVICE_ROLE_KEY")
    cors_allowed_origins: str = Field(alias="CORS_ALLOWED_ORIGINS")
    api_rate_limit: str = Field(default="120/minute", alias="API_RATE_LIMIT")
    enable_rate_limit: bool = Field(default=True, alias="ENABLE_RATE_LIMIT")
    enable_request_logging: bool = Field(default=True, alias="ENABLE_REQUEST_LOGGING")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @field_validator("supabase_anon_key", "supabase_service_role_key")
    @classmethod
    def validate_non_empty_secret(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Supabase secrets must be non-empty.")
        return cleaned

    @field_validator("database_url")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("DATABASE_URL must be non-empty.")
        if cleaned.startswith("postgres://"):
            cleaned = cleaned.replace("postgres://", "postgresql://", 1)
        if not cleaned.startswith("postgresql"):
            raise ValueError("DATABASE_URL must be a PostgreSQL connection URL.")
        return cleaned

    @cached_property
    def cors_origins(self) -> list[str]:
        origins = [
            origin.strip()
            for origin in self.cors_allowed_origins.split(",")
            if origin.strip()
        ]
        if not origins:
            raise ValueError("CORS_ALLOWED_ORIGINS must contain at least one origin.")
        return origins

    @field_validator("api_rate_limit")
    @classmethod
    def validate_api_rate_limit(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("API_RATE_LIMIT must be non-empty.")
        if "/" not in cleaned:
            raise ValueError("API_RATE_LIMIT must be in a slowapi-compatible format.")
        return cleaned


settings = Settings()
