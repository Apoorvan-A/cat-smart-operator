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
uvicorn app.main:app --reload   # http://localhost:8000/docs
pytest
```
