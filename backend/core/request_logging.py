"""Request logging middleware for API diagnostics."""

from __future__ import annotations

import logging
from time import perf_counter
from typing import Any, Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Logs request metadata and response timing for each API request."""

    async def dispatch(self, request: Request, call_next: Callable[..., Any]) -> Response:
        started_at = perf_counter()
        client_host = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "-")

        try:
            response = await call_next(request)
        except Exception:  # noqa: BLE001
            duration_ms = round((perf_counter() - started_at) * 1000, 2)
            logger.exception(
                "api_request_failed method=%s path=%s client=%s duration_ms=%s user_agent=%s",
                request.method,
                request.url.path,
                client_host,
                duration_ms,
                user_agent,
            )
            raise

        duration_ms = round((perf_counter() - started_at) * 1000, 2)
        logger.info(
            "api_request method=%s path=%s status=%s client=%s duration_ms=%s user_agent=%s",
            request.method,
            request.url.path,
            response.status_code,
            client_host,
            duration_ms,
            user_agent,
        )
        return response
