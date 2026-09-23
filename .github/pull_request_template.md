# Summary

<!-- What does this PR do and why? -->

## Subsystem
- [ ] Backend + Safety (Claude 1)
- [ ] ML + Data (Claude 2)
- [ ] Frontend + UX (Claude 3)
- [ ] Integration / docs / QA (Claude 4)

## Contract impact
- [ ] No API/WebSocket contract change
- [ ] `docs/API_CONTRACT.md` updated **and** consumers updated (four-step process in `docs/DECISIONS.md`)

## Checklist
- [ ] Tests added/updated and passing (`safety/` tests first if touched)
- [ ] No failing test deleted to go green
- [ ] No new dependency without a reason
- [ ] Non-real data labeled `SIMULATED / ASSUMED / PREDICTED`
- [ ] Safety logic stays deterministic (no LLM safety decisions)
