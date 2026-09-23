# CAT Smart Operator Assistant

An AI-powered **Smart Operator Companion** for Caterpillar heavy-machinery
operators. It turns raw machine telemetry into safety alerts, task intelligence,
machine-health insight, and grounded AI explanations — designed to run for a
full operator shift.

> **Data disclaimer:** No real Caterpillar telemetry is used. All operational
> data is **synthetic** and clearly labeled. See [`docs/ASSUMPTIONS.md`](docs/ASSUMPTIONS.md).

## Highlights

- **Deterministic safety engine** — rules (not an LLM) decide safety events;
  seatbelt, proximity, unsafe-zone detection, severity, acknowledgement, audit.
- **Real-time telemetry pipeline** — ingest → validate → normalize → rules + ML
  → contextual alert → operator, over WebSockets.
- **Grounded AI assistant** — backend tools return structured facts; the LLM
  explains them and never queries the DB or invents data.
- **ML where it earns its place** — ETA prediction, anomaly/idling detection,
  machine-health trend, each with a rule-based fallback.
- **Operator-first UX** — glanceable, safety-first, WHAT / WHY / ACTION.

## Architecture

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). The operator workflow and
full system diagram are documented there.

## Repository layout

```
cat-smart-operator/
├── CLAUDE.md              # shared engineering context
├── docs/                  # PRODUCT, ARCHITECTURE, API_CONTRACT, DATA_MODEL, ML, ...
├── backend/               # FastAPI + Postgres + safety engine  (Backend/Safety)
├── ml/                    # synthetic data + models + evaluation (ML/Data)
├── frontend/              # React + TS + Tailwind operator UI    (Frontend/UX)
├── simulator/             # telemetry / environment simulator
├── data/                  # generated synthetic datasets (gitignored)
├── scripts/               # dev + worktree + seed scripts
├── demo/                  # deterministic demo scenarios
├── tests/                 # integration + e2e (unit tests live beside code)
├── docker/                # Dockerfiles
├── docker-compose.yml
└── .github/workflows/     # CI
```

## Quick start (local, Docker)

```bash
cp .env.example .env
docker compose up --build
```

- Backend API + docs: http://localhost:8000/docs
- Frontend: http://localhost:5173
- Postgres: localhost:5432

## Quick start (without Docker)

```bash
# backend
cd backend && python -m venv .venv && . .venv/Scripts/activate && pip install -e ".[dev]"
alembic upgrade head && uvicorn app.main:app --reload

# ml (generate synthetic data + train)
cd ml && pip install -e ".[dev]" && python -m src.generate && python -m src.train

# frontend
cd frontend && npm install && npm run dev
```

## Team

Built by a four-person engineering team for a Caterpillar campus recruitment
hackathon. Subsystem ownership is documented in [`CLAUDE.md`](CLAUDE.md).

## License

Prototype / educational. Not affiliated with or endorsed by Caterpillar Inc.
