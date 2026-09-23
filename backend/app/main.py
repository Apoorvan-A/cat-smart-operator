"""FastAPI entrypoint. Owner: Claude 1.

Clean layering: routers (app/api/v1) -> services -> repositories/DB. Business
logic never lives here. See docs/API_CONTRACT.md and docs/ARCHITECTURE.md.
"""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.models  # noqa: F401 — registers all tables on Base.metadata
from app.api.v1 import (
    analytics,
    assistant,
    auth,
    incidents,
    machines,
    operators,
    safety,
    tasks,
    telemetry,
    ws,
)
from app.core.config import settings
from app.core.database import Base, engine
from app.core.errors import register_error_handlers
from app.core.logging import RequestTimingMiddleware, configure_logging


@asynccontextmanager
async def lifespan(_: FastAPI):
    configure_logging()
    # Prototype convenience: ensure tables exist. Production uses Alembic.
    Base.metadata.create_all(engine)
    yield


app = FastAPI(
    title="CAT Smart Operator Assistant API",
    version="0.1.0",
    docs_url="/docs",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RequestTimingMiddleware)

register_error_handlers(app)


@app.get("/health", tags=["meta"])
def health() -> dict:
    """Liveness probe used by docker-compose and CI."""
    return {"status": "ok", "env": settings.app_env}


for _router in (auth, operators, machines, tasks, telemetry, safety,
                incidents, analytics, assistant):
    app.include_router(_router.router, prefix="/api/v1")

# WebSocket has no /api/v1 prefix (see API_CONTRACT.md: WS /ws).
app.include_router(ws.router)
