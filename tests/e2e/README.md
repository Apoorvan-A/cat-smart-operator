# End-to-end tests

Owner: Claude 4. Full operator story from `../../docs/DEMO.md`: login -> task ->
pre-start -> start -> proximity alert -> ack -> idle anomaly -> ETA change ->
assistant -> handover. Plus failure tests (missing/stale telemetry, ML down, DB
down, WS disconnect).
