# Contributing

Four sessions build in parallel. `main` is protected — **all changes land via
Pull Request**, never a direct push.

## Branches (one per subsystem)
| Branch | Owner | Directory |
|--------|-------|-----------|
| `backend` | Claude 1 — Backend + Safety | `backend/` |
| `ml` | Claude 2 — ML + Data | `ml/`, `simulator/` |
| `frontend` | Claude 3 — Frontend + UX | `frontend/` |
| `integration` | Claude 4 — Architecture / QA | `docs/`, `demo/`, `tests/`, CI, docker |

## Flow
```bash
git switch backend         # your subsystem branch
git pull
# ...work, commit...
git push
gh pr create --base main --fill   # opens a PR; CI runs
```
Merge into `main` after CI is green (squash merge; delete the branch after).
Keep your branch current: `git switch backend && git merge main`.

## Non-negotiables (see CLAUDE.md / docs/DECISIONS.md)
1. `docs/API_CONTRACT.md` is the source of truth — don't break it silently.
2. Safety logic is deterministic; the LLM only explains, never decides.
3. Label all non-real data `SIMULATED / ASSUMED / PREDICTED`.
4. Every feature ships with tests; never delete a failing test to go green.
5. Small, frequent commits: `feat:`, `fix:`, `test:`, `docs:`.
