# CAT Smart Operator Assistant — Shared Engineering Context

> This file is loaded by every development session. It is the single source of
> shared architectural truth. If you change a contract, update the relevant doc
> in `docs/` **in the same change**.

## What we are building

An **AI-powered Smart Operator Companion** for Caterpillar heavy-machinery
operators. Not a BI dashboard — an intelligent companion that runs for a full
shift and answers, at a glance:

- Am I safe?
- Is my machine healthy?
- What am I supposed to do?
- Am I on track?
- Is anything unusual happening?

The core pipeline:

```
RAW TELEMETRY → VALIDATION → EVENT PROCESSING → RULES + ML
→ CONTEXTUAL INTELLIGENCE → ALERT / RECOMMENDATION → OPERATOR ACTION
→ LOGGING / FEEDBACK → CONTINUOUS IMPROVEMENT
```

## Non-negotiable engineering principles

1. **Safety logic is deterministic.** Rules decide whether a safety event
   exists. An LLM never decides "is this safe?". The LLM only *explains* an
   already-detected event.
2. **The LLM never touches the database directly** and never invents telemetry.
   Backend tools return structured facts; the LLM turns facts into words. If a
   fact is unavailable, say so — never hallucinate.
3. **Label everything** as `REAL`, `SIMULATED`, `ASSUMED`, `PREDICTED`, or
   `OBSERVED`. We never claim access to real CAT proprietary telemetry.
4. **Fail safe.** Missing/stale/malformed telemetry, ML failure, DB failure, and
   WebSocket disconnects must degrade gracefully, never crash, never fake live
   data.
5. **Explainability.** Every intelligent feature answers WHAT / WHY / ACTION.
6. **Simplicity over spectacle.** Use the simplest model that solves the problem.
   No deep learning without a written justification.
7. **`docs/API_CONTRACT.md` is the source of truth for APIs.** Don't silently
   break another team's interface.

Priority order: **Safety > machine protection > productivity > convenience.**

## Team ownership (four sessions)

| Session  | Owns | Directories |
|----------|------|-------------|
| Claude 1 | Backend + Safety | `backend/app/{api,services,models,schemas,safety,telemetry,auth,websocket,repositories}` |
| Claude 2 | ML + Synthetic Data | `ml/`, `simulator/`, `backend/app/ml` (interface only) |
| Claude 3 | Frontend + Operator UX | `frontend/` |
| Claude 4 | Architecture + Integration + QA | `docs/`, `demo/`, `tests/integration`, `tests/e2e`, `.github/`, `docker/`, `docker-compose.yml` |

Cross-team rules live in `docs/DECISIONS.md` and the "Cross-team rules" section
of the master prompt. Summary: update `API_CONTRACT.md` before changing an API;
don't delete failing tests; don't add dependencies without reason; prefer
reliable simple systems.

## Stack

- **Backend:** Python 3.11, FastAPI, PostgreSQL, SQLAlchemy 2.x, Alembic,
  Pydantic v2, JWT auth + RBAC, WebSockets.
- **ML:** scikit-learn (Gradient Boosting / Random Forest for ETA, Isolation
  Forest + statistical baselines for anomaly), served behind a FastAPI model
  service with deterministic rule fallbacks.
- **Frontend:** React + TypeScript + Tailwind, TanStack Query, Recharts.
- **Infra:** Docker Compose (Postgres + backend + ml + frontend), GitHub Actions CI.

## Working agreement

- Small, frequent commits with meaningful messages (`feat:`, `fix:`, `test:`,
  `docs:`).
- Each meaningful feature ships with tests.
- Four **git worktrees** (see `docs/DECISIONS.md` / `scripts/setup-worktrees.sh`)
  so sessions never edit the same working directory simultaneously.

## Roles of the docs

| Doc | Purpose |
|-----|---------|
| `docs/PRODUCT.md` | Vision, personas, operator journey, feature priority |
| `docs/ARCHITECTURE.md` | System + subsystem architecture, diagrams |
| `docs/API_CONTRACT.md` | **Source of truth** for REST + WebSocket |
| `docs/DATA_MODEL.md` | DB schema, ER diagram, relationships |
| `docs/ML.md` | Models, features, evaluation, limitations, fallbacks |
| `docs/ASSUMPTIONS.md` | KNOWN / FROM PROBLEM / ASSUMED / SIMULATED / PREDICTED / FUTURE |
| `docs/SECURITY.md` | Auth, RBAC, secrets, audit |
| `docs/TESTING.md` | Test strategy across layers |
| `docs/DEMO.md` | Deterministic demo scenarios + script |
| `docs/DECISIONS.md` | Architecture Decision Records (ADRs) |
