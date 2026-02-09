"""FastAPI application entrypoint."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.auth import router as auth_router
from api.users import router as users_router
from app.config import settings
from app.database import supabase
from core.permissions import JWTVerificationMiddleware

app = FastAPI(title=settings.app_name)

app.add_middleware(JWTVerificationMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)


@app.get("/health")
async def health_check() -> dict[str, str]:
    _ = supabase
    return {"status": "ok"}
