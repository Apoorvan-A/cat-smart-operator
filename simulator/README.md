# Telemetry / Environment Simulator

Owner: Claude 2 (data) + Claude 4 (demo wiring). Streams **correlated** synthetic
telemetry + weather + proximity events into the backend `/telemetry/ingest`
endpoint at a configurable cadence, driving the real-time demo.

All output is labeled `SIMULATED`. The simulator is the source of the demo
scenarios in `../docs/DEMO.md` — it lets us trigger a seatbelt violation,
proximity hazard, excessive idling, health anomaly, and worsening weather on a
deterministic timeline, so the story replays identically.

Scenarios are defined declaratively in `../demo/scenarios/*.json`.
