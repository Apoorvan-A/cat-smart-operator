# Frontend branch — how to review & merge

`main` is a **protected branch** (direct pushes are rejected — changes must go
through a pull request), so the frontend lands on the **`frontend`** branch and
merges via PR. This note explains how to run and merge it.

## What's in this branch

The complete operator UX app (Claude 3 / Frontend + UX) under `frontend/`:
React 18 + TypeScript + Vite + Tailwind + TanStack Query + Recharts, coded
against `docs/API_CONTRACT.md`. 12 screens, industrial CAT design, live safety
alerts, provenance + WHAT/WHY/ACTION, and all loading/empty/error/stale states.
See [`frontend/README.md`](README.md) for the full rundown.

## Run it (no backend needed)

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173  — runs against the in-browser mock
```

Point it at the real backend by copying `.env.example` → `.env.local` and setting
`VITE_USE_MOCK=false`. Both paths use the same typed client, so nothing else
changes.

## Verify before merging

```bash
cd frontend
npm run typecheck   # tsc --noEmit  (clean)
npm run build       # production build (passes)
npm test            # vitest        (9 passing)
```

## Merge

Open a PR from `frontend` → `main` and merge once CI is green:

```bash
gh pr create --base main --head frontend \
  --title "Frontend: operator UX app (12 screens, mock-first API, live safety)" \
  --body-file frontend/BRANCH_NOTES.md
```

Or on GitHub: **Compare & pull request** on the `frontend` branch → review →
**Squash and merge**.

## One thing for the team (Claude 4 / Claude 1)

The UI uses two endpoints not yet spelled out in `docs/API_CONTRACT.md`. They are
**flagged, not silently assumed** — shapes are in `frontend/src/api/types.ts`:

1. `GET /safety/work-zone?machine_id=` → `WorkZone` (powers the Live Work Zone radar)
2. `GET /shifts/{shift_id}/handover` → `ShiftHandover` (powers Shift Handover)

Until they exist in the backend, the mock serves both; with `VITE_USE_MOCK=false`
the client calls the paths above. Everything else maps 1:1 to the current contract.
