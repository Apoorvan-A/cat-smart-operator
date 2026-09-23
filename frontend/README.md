# Frontend — Operator Experience

**Owner: Claude 3 (Frontend + Operator UX).** React 18 + TypeScript + Vite +
Tailwind + TanStack Query + Recharts. Coded against `../docs/API_CONTRACT.md` —
the source of truth. No invented endpoints (see the one flagged addition below).

## Run

```bash
npm install
npm run dev        # http://localhost:5173  (mock API — no backend needed)
npm run build      # typecheck + production build
npm test           # vitest
```

By default the app runs against a **deterministic in-browser mock** of the API
contract, so it demos and reviews with zero backend. Point it at the real
FastAPI backend by copying `.env.example` → `.env.local` and setting:

```
VITE_USE_MOCK=false
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_WS_URL=ws://localhost:8000/ws
```

Both the mock (`src/api/mock.ts`) and the HTTP client (`src/api/http.ts`)
implement the **same `ApiClient` interface** (`src/api/contract.ts`), so the
switch is one flag — the screens don't change.

## Design language

Industrial operator cab, not a BI dashboard: **CAT black + hi-vis yellow**, a
disciplined severity ramp (info/warning/high/critical), large controls, strong
type hierarchy, glanceable status. Yellow is reserved for the primary action and
brand only. Dark by default (night shifts, cab glare). Custom SVG components
(health ring, proximity radar, sparklines) — no chart-soup.

Priority order baked into the UI: **safety → clarity → actionability →
glanceability → simplicity.**

- Every intelligent value carries a **provenance tag** (`PREDICTED` / `SIMULATED`
  / `OBSERVED` / `ASSUMED`) — the operator never mistakes a model estimate for a
  measurement.
- Every intelligent feature answers **WHAT / WHY / ACTION** (`WhatWhyAction`).
- Safety is never buried: a HIGH/CRITICAL WebSocket alert raises a global
  overlay (`CriticalAlertOverlay`) above every screen.
- Required states are all implemented: loading skeletons, empty, error, and
  **stale telemetry** ("Telemetry unavailable — last update Xs ago", never fake
  live data), plus WebSocket reconnect status in the header.

## Screens (`src/pages/`)

Login · Command Center · Daily Tasks · Task Detail · Machine Health · Safety
Center · Live Work Zone · Incidents · Training Hub · Analytics · Shift Handover ·
AI Assistant. One coherent operator workflow, matching `docs/DEMO.md`.

**Demo:** on the Command Center, **Play demo event** replays the DEMO.md beats
over the (mock) WebSocket — proximity HIGH alert → idling insight → ETA moves
14:30 → 14:47. **Reset** rewinds it.

## Layout

```
src/
  api/         contract.ts (interface) · types.ts (from API_CONTRACT) ·
               http.ts (real) · mock.ts (deterministic demo) · index.ts (switch)
  pages/       one file per screen
  components/  AppShell, AlertCard, WhatWhyAction, HealthRing, ProximityRadar,
               Sparkline, badges (Severity/Provenance/Status), status (Live/Stale),
               CriticalAlertOverlay, ui (Panel/StatTile/…), icons (inline SVG)
  hooks/       useAuth · useWebSocket (reconnect) · queries (TanStack Query)
  lib/         format (helpers + severity/provenance metadata) · demoBus
```

## API additions the UI needs (request to Claude 4 / Claude 1)

The screens use two endpoints not yet spelled out in `docs/API_CONTRACT.md`.
Per the cross-team rules I'm flagging them here rather than assuming them
silently — please fold into the contract (shapes are in `src/api/types.ts` and
`http.ts`):

1. `GET /safety/work-zone?machine_id=` → `WorkZone` (machine at origin, tracked
   entities with `distance_m`, `threshold_m`, `provenance`). Powers the Live Work
   Zone radar. Alternatively expose via `/safety/proximity`.
2. `GET /shifts/{shift_id}/handover` → `ShiftHandover` (completed/remaining
   tasks, machine health, safety summary, fuel, abnormal behavior, maintenance
   rec, pending actions). Powers Shift Handover.

Until they exist, the mock serves both; with `VITE_USE_MOCK=false` they hit the
paths above. Everything else maps 1:1 to the current contract.
