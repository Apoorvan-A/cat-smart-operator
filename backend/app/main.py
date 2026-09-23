"""FastAPI entrypoint. Owner: Claude 1.

This is the integration-ready shell. Routers are registered per subsystem under
app/api/v1. Business logic lives in services, not here. See docs/API_CONTRACT.md.
"""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings

app = FastAPI(
    title="CAT Smart Operator Assistant API",
    version="0.1.0",
    docs_url="/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["meta"])
def health() -> dict:
    """Liveness probe used by docker-compose and CI."""
    return {"status": "ok", "env": settings.app_env}


# Routers are wired here as each subsystem lands, e.g.:
# from app.api.v1 import auth, tasks, telemetry, safety, machines, incidents, \
#     training, analytics, assistant
# for router in (auth, tasks, telemetry, safety, machines, incidents,
#                training, analytics, assistant):
#     app.include_router(router.router, prefix="/api/v1")
