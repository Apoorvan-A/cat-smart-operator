"""Structured logging + request-timing middleware. Owner: Claude 1.

Minimal observability (docs/ARCHITECTURE.md §14): one structured log line per
request with path, status, and latency in ms.
"""
from __future__ import annotations

import logging
import sys
import time

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from app.core.config import settings


def configure_logging() -> None:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(name)s %(message)s"))
    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(settings.log_level.upper())


logger = logging.getLogger("cat.request")


class RequestTimingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        elapsed_ms = (time.perf_counter() - start) * 1000
        logger.info(
            "method=%s path=%s status=%s latency_ms=%.1f",
            request.method, request.url.path, response.status_code, elapsed_ms,
        )
        response.headers["X-Response-Time-ms"] = f"{elapsed_ms:.1f}"
        return response
