"""FastAPI application entrypoint."""

from importlib import import_module
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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


def _load_rate_limit_dependencies() -> tuple[object, object, object, object, object]:
    slowapi_module = import_module("slowapi")
    slowapi_errors_module = import_module("slowapi.errors")
    slowapi_middleware_module = import_module("slowapi.middleware")
    slowapi_util_module = import_module("slowapi.util")
    return (
        slowapi_module.Limiter,
        slowapi_module._rate_limit_exceeded_handler,
        slowapi_errors_module.RateLimitExceeded,
        slowapi_middleware_module.SlowAPIMiddleware,
        slowapi_util_module.get_remote_address,
    )


def _configure_rate_limit(app_instance: FastAPI, *, enabled: bool, api_rate_limit: str) -> None:
    if not enabled:
        return

    try:
        (
            limiter_cls,
            exceeded_handler,
            rate_limit_exceeded_error,
            slowapi_middleware_cls,
            get_remote_address_func,
        ) = _load_rate_limit_dependencies()
    except ModuleNotFoundError as exc:
        raise RuntimeError(
            "Rate limiting is enabled but 'slowapi' is not installed. "
            "Install backend dependencies with `pip install -r requirements.txt` "
            "or set `ENABLE_RATE_LIMIT=false`."
        ) from exc

    limiter = limiter_cls(
        key_func=get_remote_address_func,
        default_limits=[api_rate_limit],
    )
    app_instance.state.limiter = limiter
    app_instance.add_exception_handler(rate_limit_exceeded_error, exceeded_handler)
    app_instance.add_middleware(slowapi_middleware_cls)


if settings.enable_request_logging:
    app.add_middleware(RequestLoggingMiddleware)

_configure_rate_limit(
    app,
    enabled=settings.enable_rate_limit,
    api_rate_limit=settings.api_rate_limit,
)

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
