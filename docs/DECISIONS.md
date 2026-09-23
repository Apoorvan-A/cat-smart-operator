# Architecture Decision Records

Owner: Claude 4. One ADR per meaningful decision. Format: Context / Decision /
Consequences. Newest first.

---

## ADR-0001 — Deterministic safety engine, LLM only explains
**Context:** Safety events must be reliable and auditable; LLMs are non-deterministic.
**Decision:** Safety events are created by hard-coded rules on validated telemetry.
The LLM never decides whether a hazard exists; it only explains events already
created. **Consequences:** Testable, auditable safety; the assistant depends on
the safety engine, not vice-versa.

## ADR-0002 — ML as a separate service with deterministic fallback
**Context:** ML availability/latency must not affect the safety-critical backend.
**Decision:** Models run in a separate FastAPI service (`ML_SERVICE_URL`); the
backend applies a rule-based fallback on failure/timeout, marking provenance
`ASSUMED`. **Consequences:** Backend stays reliable; slightly more infra; clean
ML/backend contract.

## ADR-0003 — `API_CONTRACT.md` is the single source of truth
**Context:** Four sessions build in parallel and must not break each other.
**Decision:** All request/response and WebSocket shapes live in
`API_CONTRACT.md`; changes require the four-step change process (update doc →
record here → update consumers → integration tests). **Consequences:** Predictable
integration; small process overhead.

## ADR-0004 — Git worktrees, not four sessions in one directory
**Context:** Concurrent edits to one working tree cause conflicts and confusion.
**Decision:** Each session works in its own worktree/branch
(`backend`, `ml`, `frontend`, `integration`) off `main`; integration owns merges.
See `scripts/setup-worktrees.sh`. **Consequences:** Isolation; merges funnel
through Claude 4.

## ADR-0005 — Provenance labeling on all non-real data
**Context:** We must never imply access to real Caterpillar telemetry.
**Decision:** Every non-real payload/row carries a `provenance` field
(`REAL/SIMULATED/ASSUMED/PREDICTED/OBSERVED`). **Consequences:** Honest UX;
reviewers can see exactly what is synthetic vs computed vs predicted.

## ADR-0006 — Scope: one polished vertical slice over 15 shallow modules
**Context:** Recruiting review rewards a coherent end-to-end story over feature count.
**Decision:** Prioritize the single narrative Operator → Machine → Task →
Telemetry → Safety → ML → Alert → AI explanation → Handover. Other modules are
stubs/stretch. **Consequences:** Stronger demo; some listed features deferred
(documented as stretch in `PRODUCT.md`).

---

### Cross-team rules (binding)
1. `API_CONTRACT.md` is the source of truth. 2. Don't silently break another
team's interface. 3. To change an API: update the doc, explain why here, update
consumers, run integration tests. 4. Never delete a failing test. 5. No
unnecessary dependencies. 6. Don't overengineer beyond the demo/engineering value.
7. Prefer simple reliable systems. 8. Label SIMULATED/ASSUMED/PREDICTED/REAL.
9. Never claim real CAT telemetry. 10. Never fabricate model accuracy.
