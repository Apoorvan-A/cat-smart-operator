# Frontend — Operator Experience

**Owner: Claude 3 (Frontend + Operator UX).** React + TypeScript + Tailwind +
TanStack Query. Code against `../docs/API_CONTRACT.md` — do not invent endpoints;
if the API is insufficient, request the change in `API_CONTRACT.md` first.

## Design principles (operator, not analyst)
Safety → clarity → actionability → glanceability → simplicity. Large controls,
minimal text, critical alerts never hidden behind analytics. Every important
alert answers **WHAT / WHY / ACTION**.

## Must-have states
Loading, empty, error, **stale telemetry** ("Telemetry unavailable — last update
Xs ago"), and WebSocket reconnect. Never show fake live data unlabeled — respect
the `provenance` field from the API.

## Screens (coherent workflow, not maximal count)
Login · Command Center · Daily Tasks · Task Detail · Machine Health · Safety
Center · Live Work Zone · Incidents · Training · Analytics · Shift Handover · AI
Assistant.

## Layout
```
src/
  pages/       # one file per screen above
  components/  # shared UI (AlertCard, SeverityBadge, ProvenanceTag, ...)
  api/         # typed client generated from API_CONTRACT.md
  hooks/       # data + websocket hooks
  lib/         # formatting, ws reconnect
```

## Run
```bash
npm install
npm run dev      # http://localhost:5173
npm test
```
