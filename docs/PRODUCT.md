# Product

Owner: Claude 4 + Claude 3. What we build, for whom, and in what priority.

## Vision
An AI-powered **Smart Operator Companion** that runs for a full shift and turns
raw telemetry into decisions: *Am I safe? Is my machine healthy? What do I do
next? Am I on track? Is anything unusual?* — always answering WHAT / WHY / ACTION.

## Primary persona — the operator
Works in noisy environments, may wear gloves, is time-pressured, glances briefly,
handles safety-critical moments. Therefore: large controls, strong hierarchy,
minimal text, obvious next action, critical alerts never hidden behind analytics.
Priority: **Safety > machine protection > productivity > convenience.**

Secondary personas: Supervisor (incident review, oversight), Safety Manager
(escalations, safety analytics), Admin (users).

## Operator journey
Login → Command Center → today's task → pre-start safety check → start task →
live operation with real-time safety + health + anomaly monitoring → alerts &
acknowledgements → dynamic ETA → ask the AI assistant → task complete → shift
handover → training recommendation. (Diagram in `ARCHITECTURE.md` §6.)

## Feature prioritization

### MVP (the vertical slice we will demo)
1. Auth + roles.
2. Command Center.
3. Daily tasks + dynamic ETA (ML + fallback).
4. Pre-start safety check.
5. Real-time safety center: seatbelt + proximity, severity, acknowledge, audit.
6. Machine health (state + anomaly).
7. Unusual-operation / idling insight.
8. Alert intelligence (grouping/lifecycle) + WebSocket.
9. Grounded AI assistant.
10. Shift handover.
11. Training recommendation tied to safety events.

### Stretch (only if the slice is solid)
- Work-zone/geofencing map beyond the proximity view.
- Predictive-maintenance trend detail.
- Offline incident creation + queued sync.
- Observability dashboards (Prometheus/Grafana).
- Instructor booking backend, simulation module.

### Explicitly NOT building
Generic BI/admin dashboard; random "AI" features; ML everywhere; LLM-driven
safety decisions; exact component-failure prediction; medical/fatigue inference;
hundreds of screens; meaningless charts. (See `DECISIONS.md` ADR-0006.)

## Screens (Claude 3)
Login · Command Center · Daily Tasks · Task Detail · Machine Health · Safety
Center · Live Work Zone · Incidents · Training · Analytics · Shift Handover · AI
Assistant. Build a coherent workflow, not a maximal set of pages.
