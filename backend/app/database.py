"""Database clients and session helpers."""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from supabase import Client, create_client

from app.config import settings


def get_supabase_admin_client() -> Client:
    return create_client(str(settings.supabase_url), settings.supabase_service_role_key)


def get_supabase_anon_client() -> Client:
    return create_client(str(settings.supabase_url), settings.supabase_anon_key)


supabase_admin: Client = get_supabase_admin_client()
supabase_anon: Client = get_supabase_anon_client()

# Backward-compatible alias used outside auth flows.
supabase: Client = supabase_admin

engine = create_engine(settings.database_url, pool_pre_ping=True, future=True)
SessionLocal = sessionmaker(
    bind=engine, autoflush=False, autocommit=False, expire_on_commit=False
)


def get_db_session() -> Generator[Session, None, None]:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
