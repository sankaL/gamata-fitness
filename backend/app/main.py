"""FastAPI application entrypoint."""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

from api.auth import router as auth_router
from api.import_export import router as import_export_router
from api.plan_activation import router as plan_activation_router
from api.plans import router as plans_router
from api.progress import router as progress_router
from api.sessions import router as sessions_router
from api.user_dashboard import router as user_dashboard_router
from api.users import router as users_router
from api.workouts import router as workouts_router
from app.config import settings
from app.database import supabase
from core.permissions import JWTVerificationMiddleware
from core.request_logging import RequestLoggingMiddleware

app = FastAPI(title=settings.app_name)

logging.basicConfig(level=logging.INFO)

if settings.enable_request_logging:
    app.add_middleware(RequestLoggingMiddleware)

if settings.enable_rate_limit:
    limiter = Limiter(
        key_func=get_remote_address,
        default_limits=[settings.api_rate_limit],
    )
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(SlowAPIMiddleware)

app.add_middleware(JWTVerificationMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(import_export_router)
app.include_router(users_router)
app.include_router(workouts_router)
app.include_router(plans_router)
app.include_router(plan_activation_router)
app.include_router(user_dashboard_router)
app.include_router(sessions_router)
app.include_router(progress_router)


@app.get("/health")
async def health_check() -> dict[str, str]:
    _ = supabase
    return {"status": "ok"}
