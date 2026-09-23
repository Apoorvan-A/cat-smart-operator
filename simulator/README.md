# Telemetry / Environment Simulator

Owner: Claude 2 (data) + Claude 4 (demo wiring). Streams **correlated** synthetic
telemetry + weather + proximity events into the backend `/telemetry/ingest`
endpoint at a configurable cadence, driving the real-time demo.

All output is labeled `SIMULATED`. The simulator is the source of the demo
scenarios in `../docs/DEMO.md` — it lets us trigger a seatbelt violation,
proximity hazard, excessive idling, health anomaly, and worsening weather on a
deterministic timeline, so the story replays identically.

Scenarios are defined declaratively in `../demo/scenarios/*.json` and played by
`run.py` (stdlib only):

```bash
# print a scenario's timeline and validate it (no backend needed)
python simulator/run.py seatbelt_violation

# drive the live backend once /telemetry/ingest exists (5x time compression)
python simulator/run.py task_delay --live --speed 5
```

`--dry-run` (default) works today; `--live` POSTs telemetry to
`BACKEND_URL/api/v1/telemetry/ingest`. Proximity/weather/operator-action steps
are logged until their endpoints land (tracked in issue #5).
