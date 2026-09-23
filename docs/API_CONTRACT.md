# API Contract — SOURCE OF TRUTH

Owner: Claude 4. **Any change here requires: (1) update this file, (2) note why
in `DECISIONS.md`, (3) update affected consumers, (4) run integration tests.**
Frontend (Claude 3) and Backend (Claude 1) both code against this file.

- Base URL: `/api/v1`
- Auth: `Authorization: Bearer <jwt>` on all routes except `/auth/login`.
- Content type: `application/json`.
- All timestamps are ISO-8601 UTC (`2025-05-01T08:00:00Z`).
- Every intelligent payload carries a `provenance` field:
  `REAL | SIMULATED | ASSUMED | PREDICTED | OBSERVED`.

## Conventions

### Error envelope
```json
{ "error": { "code": "STRING_CODE", "message": "human readable", "detail": {} } }
```
Codes: `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`,
`TELEMETRY_STALE`, `ML_UNAVAILABLE`, `CONFLICT`, `INTERNAL`.

### Severity enum
`INFO | WARNING | HIGH | CRITICAL`

### Roles (RBAC)
`OPERATOR | SUPERVISOR | SAFETY_MANAGER | ADMIN`

---

## Auth

### POST /auth/login
Request: `{ "username": "op1001", "password": "..." }`
Response 200:
```json
{ "access_token": "jwt...", "token_type": "bearer",
  "user": { "id": "OP1001", "name": "Jane Doe", "role": "OPERATOR" } }
```

### GET /auth/me
Response 200: the `user` object above.

---

## Operators

### GET /operators/{id}
```json
{ "id": "OP1001", "name": "Jane Doe", "role": "OPERATOR",
  "current_machine_id": "EXC001", "current_shift_id": "SH-2025-05-01-A" }
```

### GET /operators/{id}/training
Array of training records (see Training).

---

## Machines

### GET /machines/{machine_id}
```json
{ "id": "EXC001", "type": "EXCAVATOR", "model": "CAT 320",
  "site_id": "SITE-A", "status": "OPERATING", "engine_hours": 1526.5 }
```
`status`: `IDLE | OPERATING | OFF | MAINTENANCE`.

### GET /machines/{machine_id}/health
```json
{ "machine_id": "EXC001", "state": "NORMAL", "health_score": 0.86,
  "provenance": "PREDICTED",
  "signals": [
    { "name": "engine_temperature", "value": 95.2, "unit": "C", "state": "NORMAL" },
    { "name": "hydraulic_pressure", "value": 210, "unit": "bar", "state": "WARNING" }
  ],
  "explanation": { "what": "...", "why": "...", "action": "..." } }
```
`state`: `NORMAL | WARNING | DEGRADED | CRITICAL`.

### GET /machines/{machine_id}/telemetry?limit=&since=
Array of telemetry rows (see DATA_MODEL). Includes `stale: bool` and
`last_update_age_seconds` at the top level:
```json
{ "stale": false, "last_update_age_seconds": 3, "rows": [ ... ] }
```

---

## Tasks

### GET /tasks/today
```json
[ { "id": "T-101", "title": "Trench excavation — north lot", "type": "EXCAVATION",
    "priority": "HIGH", "site_id": "SITE-A", "machine_id": "EXC001",
    "state": "IN_PROGRESS", "progress": 0.62,
    "scheduled_start": "2025-05-01T08:00:00Z",
    "original_eta": "2025-05-01T14:30:00Z",
    "predicted_eta": "2025-05-01T14:47:00Z",
    "eta_provenance": "PREDICTED" } ]
```
`state`: `SCHEDULED | STARTED | IN_PROGRESS | AT_RISK | DELAYED | COMPLETED | CANCELLED`.

### GET /tasks/{id}
Full task incl. `delay_reason`, `environment` (weather snapshot), `events[]`.

### POST /tasks/{id}/predict-eta
Request: `{}` (server pulls current telemetry + weather).
Response:
```json
{ "task_id": "T-101", "predicted_eta": "2025-05-01T14:47:00Z",
  "delta_minutes": 17, "provenance": "PREDICTED",
  "explanation": { "what": "ETA moved from 14:30 to 14:47",
    "why": "Heavy rainfall increased average cycle time ~12%",
    "action": "No action needed; monitor site drainage" },
  "fallback_used": false }
```
On ML failure: `fallback_used: true`, `provenance: "ASSUMED"`, estimate from
historical average.

### POST /tasks/{id}/start  •  POST /tasks/{id}/complete
State transitions; return the updated task.

---

## Telemetry

### POST /telemetry/ingest
Request (single reading or batch). Requires `idempotency_key` per reading.
```json
{ "readings": [ { "idempotency_key": "EXC001-1714550400",
  "timestamp": "2025-05-01T10:00:00Z", "machine_id": "EXC001",
  "operator_id": "OP1001", "engine_hours": 1524.8, "fuel_used": 3.8,
  "load_cycles": 2, "idle_time": 55, "cycle_time": 42.0,
  "engine_temperature": 96.1, "hydraulic_pressure": 205, "engine_load": 0.7,
  "speed": 0, "latitude": 12.34, "longitude": 56.78,
  "seatbelt_status": "UNFASTENED", "warning_code": null,
  "machine_state": "OPERATING" } ] }
```
Response: `{ "accepted": 1, "duplicates": 0, "quarantined": 0 }`.
Ingest triggers rule + ML evaluation and may emit WebSocket events.

---

## Safety

### GET /safety/events?machine_id=&severity=&since=
Array of safety events:
```json
{ "id": "SE-9001", "timestamp": "2025-05-01T10:00:03Z", "type": "SEATBELT_UNFASTENED",
  "severity": "HIGH", "machine_id": "EXC001", "operator_id": "OP1001",
  "location": { "lat": 12.34, "lng": 56.78 },
  "telemetry_context": { "...": "..." }, "provenance": "SIMULATED",
  "recommended_action": "Fasten seatbelt before operating",
  "acknowledged": false }
```
Event types: `SEATBELT_UNFASTENED | PROXIMITY_HAZARD | RESTRICTED_ZONE_ENTRY |
OVERSPEED | UNSAFE_SLOPE | SUDDEN_MOVEMENT`.

### GET /safety/alerts?status=
Alert lifecycle objects. `status`: `CREATED | ACTIVE | ACKNOWLEDGED | RESOLVED | ESCALATED`.
Related alerts are grouped:
```json
{ "id": "AL-501", "severity": "HIGH", "status": "ACTIVE", "count": 3,
  "grouped_event_ids": ["SE-9001","SE-9002","SE-9003"],
  "summary": "3 related safety events in the last 2 minutes" }
```

### POST /safety/alerts/{id}/acknowledge
Request: `{ "note": "optional" }`. Returns updated alert; writes audit record.

### POST /safety/alerts/{id}/escalate
Request: `{ "to_role": "SUPERVISOR" }`.

---

## Incidents

### POST /incidents
```json
{ "machine_id": "EXC001", "operator_id": "OP1001",
  "type": "NEAR_MISS", "description": "...", "occurred_at": "..." }
```
Response includes reconstructed `timeline[]` (telemetry + nearby safety events +
weather around `occurred_at`).

### GET /incidents/{id}
Full incident with timeline, notes, review status.

---

## Training

### GET /operators/{id}/training
```json
[ { "module_id": "TR-EXC-SAFE", "title": "Safe Excavator Operation",
    "status": "RECOMMENDED", "reason": "3 proximity alerts in recent shifts",
    "provenance": "OBSERVED", "completion": 0.0 } ]
```
`status`: `RECOMMENDED | IN_PROGRESS | COMPLETED | NOT_STARTED`.

### POST /training/{module_id}/book-instructor
Request: `{ "operator_id": "OP1001", "slot": "2025-05-03T09:00:00Z" }`.

---

## Analytics

### GET /analytics/fuel?machine_id=&operator_id=&window=
```json
{ "fuel_per_hour": 12.4, "fuel_per_cycle": 0.9, "idle_fuel_estimate": 3.1,
  "baseline_fuel_per_cycle": 0.72, "provenance": "OBSERVED",
  "insight": { "what": "Idle time up 24% vs machine baseline",
    "why": "Extended idle periods on 3 cycles", "action": "Shut down during waits" } }
```

### GET /analytics/productivity?machine_id=&window=
`cycles_per_hour`, `idle_percentage`, `task_completion_rate`, etc.

---

## AI Assistant (grounded)

### POST /assistant/query
Request: `{ "operator_id": "OP1001", "question": "Why is my task delayed?" }`
Response:
```json
{ "answer": "Your task ETA moved to 14:47 because rainfall slowed cycle times.",
  "grounded": true,
  "facts_used": [ { "tool": "tasks.predict_eta", "task_id": "T-101" } ],
  "provenance": "PREDICTED",
  "data_available": true }
```
If required facts are missing: `data_available: false`, and `answer` states the
data is unavailable. The LLM never fabricates. When `LLM_PROVIDER` is empty a
deterministic template explainer produces `answer`.

---

## WebSocket

### `WS /ws?token=<jwt>`
Server → client messages:
```json
{ "type": "SAFETY_ALERT", "payload": { ...alert object... } }
{ "type": "TELEMETRY_TICK", "payload": { "machine_id": "EXC001", "stale": false, "...": "..." } }
{ "type": "ETA_UPDATE", "payload": { "task_id": "T-101", "predicted_eta": "..." } }
{ "type": "TELEMETRY_STALE", "payload": { "machine_id": "EXC001", "age_seconds": 134 } }
{ "type": "SNAPSHOT", "payload": { "active_alerts": [ ... ] } }
```
On connect the server sends one `SNAPSHOT`. Client acks alerts via the REST
acknowledge endpoint (not over WS).
