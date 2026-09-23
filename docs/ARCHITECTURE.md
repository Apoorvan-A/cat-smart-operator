# Architecture

Owner: Claude 4 (Architecture / Integration / QA). Keep this in sync with
`API_CONTRACT.md` and `DATA_MODEL.md`.

## 1. System overview

```mermaid
flowchart TB
    OP["Operator"]
    UI["React / TypeScript<br/>Operator Interface"]
    API["FastAPI<br/>API Gateway"]
    AUTH["Auth + RBAC"]

    subgraph Services
      TASK["Task Service"]
      SAFETY["Safety Engine (deterministic)"]
      TELEMETRY["Telemetry Service"]
      MACHINE["Machine Health Service"]
      INCIDENT["Incident Service"]
      TRAINING["Training Service"]
      ALERT["Alert Intelligence"]
      ASSISTANT["AI Assistant Service"]
    end

    subgraph ML["ML Service (separate process)"]
      ETA["ETA Prediction"]
      ANOM["Anomaly Detection"]
      HEALTH["Health Model"]
    end

    DB[("PostgreSQL")]
    WS["WebSocket Hub"]
    SIM["Telemetry / Environment Simulator"]

    OP --> UI --> API
    API --> AUTH
    API --> TASK & SAFETY & TELEMETRY & MACHINE & INCIDENT & TRAINING & ASSISTANT

    SIM --> TELEMETRY
    TELEMETRY --> SAFETY & MACHINE & ML
    ML --> ETA & ANOM & HEALTH

    SAFETY --> ALERT
    MACHINE --> ALERT
    ML --> ALERT
    TASK --> ETA

    TASK & TELEMETRY & SAFETY & MACHINE & INCIDENT & TRAINING & ALERT --> DB
    ALERT --> WS
    TELEMETRY --> WS
    WS --> UI

    ASSISTANT --> TASK & MACHINE & SAFETY & INCIDENT & TRAINING
```

**Key boundary:** the ML models run as a **separate service** behind an HTTP
interface (`ML_SERVICE_URL`). The backend calls it and applies a deterministic
fallback on any failure or timeout. This keeps the safety-critical backend
independent of ML availability.

## 2. Telemetry / intelligence pipeline

```mermaid
flowchart LR
    A["Machine / Sensor Data"] --> B["Validation"] --> C["Normalization"]
    C --> D["Telemetry Storage"]
    C --> E["Deterministic Rules"]
    C --> F["ML / Statistical Models"]
    E --> G["Context Engine"]
    F --> G
    G --> H["Alert / Recommendation"]
    H --> I["Operator Interface"]
    H --> J["Audit Log"]
```

Validation and normalization run **before** anything is stored or evaluated.
Malformed or impossible readings are quarantined, not evaluated as safety events.

## 3. Safety event flow (deterministic)

```mermaid
sequenceDiagram
    participant Sensor
    participant Telemetry
    participant Safety
    participant Alert
    participant WS as WebSocket
    participant Operator
    participant DB

    Sensor->>Telemetry: Seatbelt = Unfastened (machine operating)
    Telemetry->>Safety: Telemetry Event
    Safety->>Safety: Evaluate rule (deterministic)
    Safety->>Alert: Create HIGH alert
    Alert->>DB: Persist event
    Alert->>WS: Push alert
    WS->>Operator: Safety warning
    Operator->>Alert: Acknowledge
    Alert->>DB: Update status (audit)
```

The **Safety Engine never calls the LLM**. The AI Assistant may later *explain*
an event that the rules already created.

## 4. AI assistant architecture (grounded)

```mermaid
flowchart LR
    U["Operator question"] --> API["Assistant API"]
    API --> INTENT["Intent / Tool Selection"]
    INTENT --> TOOLS["Controlled Backend Tools<br/>(Task / Machine / Safety / Training / Incident / Analytics)"]
    TOOLS --> FACTS["Structured Facts"]
    FACTS --> LLM["LLM Explanation Layer"]
    LLM --> RESP["Grounded Operator Response"]
    RESP --> U
```

Rules: the LLM never queries the DB, never invents telemetry, never makes
safety decisions. If a tool returns "no data", the answer says the data is
unavailable. A deterministic template explainer is used when no LLM is
configured (`LLM_PROVIDER` empty).

## 5. ML pipeline

```mermaid
flowchart TB
    D["Synthetic / Historical Data"] --> V["Data Validation"] --> FE["Feature Engineering"]
    FE --> S["Train / Validation / Test split"]
    S --> ETA["ETA Model"] & ANOM["Anomaly Model"] & HEALTH["Health Model"]
    ETA & ANOM & HEALTH --> EV["Evaluation"]
    EV --> SVC["Model Service"]
    SVC --> API["FastAPI"]
    SVC --> FB["Fallback Rules"]
```

Details, features, metrics, and fallbacks: `ML.md`.

## 6. Full operator workflow (the product story)

```mermaid
flowchart TB
    TEL["Telemetry"] --> LOGIN["Operator Login"]
    TEL --> SAFEMON["Safety Monitoring"]
    TEL --> MLDET["ML / Anomaly Detection"]
    TEL --> ETA["Dynamic ETA"]

    LOGIN --> PRE["Pre-Start Safety Check"] --> MH["Machine Health Check"] --> TODAY["Today's Task"] --> START["Start Task"] --> LIVE["Live Operation"]
    SAFEMON -- Hazard --> ALERT["Alert"]
    MLDET -- Anomaly --> ALERT
    ALERT --> ACTION["Operator Action"]
    ACTION -- Resolved --> LIVE
    ACTION -- Serious --> INC["Incident"]
    LIVE --> DONE["Task Complete"] --> HAND["Shift Handover"] --> TRAIN["Training Recommendation"]
```

This is the single continuous story the demo follows (`DEMO.md`).

## 7. Backend layering

```
API layer (routers)      -> request/response only, no business logic
  Service layer          -> business logic, orchestration
    Repository layer     -> DB access (SQLAlchemy)
    Safety engine        -> deterministic rules
    ML client            -> HTTP to ML service + fallback
Database (PostgreSQL)
```

No business logic in route handlers. No SQL in services (goes through repos).

## 8. Real-time architecture

Telemetry ingest → telemetry service → rules + ML → alert service → WebSocket hub
→ frontend. Reconnect with backoff on the client; the hub replays the current
active-alert snapshot on (re)connect so a reconnecting client is never blind.

## 9. Reliability / failure handling

| Failure | Behavior |
|---------|----------|
| Missing/stale telemetry | UI shows "Telemetry unavailable — last update Xs ago"; no fake values |
| Malformed reading | Quarantined at validation; logged; not evaluated |
| Duplicate event | Idempotency key on ingest; deduplicated |
| ML service down/slow | Backend uses rule-based fallback (historical average / thresholds) |
| DB unavailable | 503 with clear error; safety cache serves last-known critical state |
| WebSocket disconnect | Client backoff reconnect; snapshot replay on reconnect |

## 10. Deployment

Docker Compose for the demo (db + backend + ml + frontend). CI in
`.github/workflows/ci.yml` runs lint + unit + integration on push.
