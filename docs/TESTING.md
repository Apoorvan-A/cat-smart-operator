# Testing Strategy

Owner: Claude 4 (integration/e2e) with each session owning its unit tests.
Rule: never delete a failing test to make CI green — fix the cause or document it.

## Layers

### Unit (beside the code)
- **Safety rules** (Claude 1): each rule — seatbelt, proximity, zone, overspeed,
  slope — with positive, negative, and boundary cases. These are the highest
  priority tests in the repo.
- **Validators / normalizers** (Claude 1): malformed, out-of-range, duplicate.
- **ML features & fallbacks** (Claude 2): feature construction, leakage checks,
  fallback triggers, deterministic output shape.
- **Services** (Claude 1): business logic with repositories mocked.

### Integration (`tests/integration/`, Claude 4)
- API + real Postgres (test container / ephemeral DB).
- Telemetry ingest → safety event → alert → WebSocket emission.
- ML client → fallback path when ML service is unavailable.
- Assistant query → fact tools → grounded response (LLM stubbed).

### End-to-end (`tests/e2e/`, Claude 4)
- Operator login → today's task → pre-start check → start → proximity alert →
  acknowledge → idle anomaly → ETA change → assistant explanation → handover.
  This mirrors the demo story in `DEMO.md`.

### Failure tests (Claude 4)
Missing telemetry, stale telemetry, malformed reading, duplicate event, ML
unavailable, DB unavailable, WebSocket disconnect/reconnect. Each asserts the
system degrades per `ARCHITECTURE.md` §9 and never shows fake live data.

### ML tests (Claude 2)
Synthetic-data validation (correlations hold), leakage checks, evaluation
reproducibility, edge cases.

## Running
```bash
# backend unit + integration
cd backend && pytest
# ml
cd ml && pytest
# frontend
cd frontend && npm test
# full integration (compose up test stack)
make test-integration
```

## CI
`.github/workflows/ci.yml` runs lint + backend unit + ml unit + frontend build +
integration on every push/PR. A red build blocks merge to `main`.
