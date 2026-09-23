# Backend — FastAPI + Safety Engine

**Owner: Claude 1 (Backend + Safety).** Code against `../docs/API_CONTRACT.md`.

## Layout
```
app/
  main.py        # FastAPI app (routers wired here)
  core/          # config, db session, security helpers
  api/v1/        # routers only — no business logic
  services/      # business logic / orchestration
  repositories/  # SQLAlchemy DB access
  models/        # ORM models (see ../docs/DATA_MODEL.md)
  schemas/       # Pydantic request/response
  safety/        # DETERMINISTIC safety rules (highest priority)
  telemetry/     # ingest, validation, normalization
  auth/          # JWT + RBAC
  websocket/     # real-time hub
  ml/            # HTTP client to the ML service + fallbacks
tests/           # unit + service tests (pytest)
```

## Rules of the road
- No business logic in routers; no SQL in services (use repositories).
- Safety logic is deterministic — never call the LLM to decide a hazard.
- Never break `API_CONTRACT.md` silently; follow the four-step change process.
- Every feature ships with tests. `safety/` tests come first.

## Run
```bash
pip install -e ".[dev]"

# Quick local run with SQLite (no Postgres needed):
export DATABASE_URL="sqlite:///./dev.db"   # PowerShell: $env:DATABASE_URL="sqlite:///./dev.db"
python -m app.seed                          # demo data: operator OP1001 / password 'demo'
uvicorn app.main:app --reload               # http://localhost:8000/docs

pytest                                       # 30 tests (SQLite, no server needed)
```

In Docker, `DATABASE_URL` points at Postgres (see `.env` / `docker-compose.yml`).

## What's implemented
Auth+JWT+RBAC · telemetry ingest (validate/dedup/quarantine) · **deterministic
safety engine** (seatbelt, worker/vehicle proximity, overspeed, unsafe slope,
sudden movement) · alert grouping + acknowledge/escalate + audit · machine health
· tasks + dynamic ETA (ML client w/ fallback) · incidents w/ timeline · training
recommendations · fuel/productivity analytics · grounded AI assistant · WebSocket
hub. Tables auto-create on startup for the prototype; Alembic for production.
