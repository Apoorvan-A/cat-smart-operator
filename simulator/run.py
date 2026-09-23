"""Demo scenario runner. Owner: Claude 4 (demo wiring).

Reads a scenario from demo/scenarios/*.json and plays its timeline. Two modes:

  --dry-run  (default) print the planned timeline and validate the scenario;
             works today, no backend required.
  --live     POST telemetry to BACKEND_URL/api/v1/telemetry/ingest on schedule
             (usable once Claude 1 lands the ingest endpoint).

Stdlib only, so it runs anywhere. All emitted data is SIMULATED.

Usage:
  python simulator/run.py seatbelt_violation
  python simulator/run.py task_delay --live --speed 5
"""
from __future__ import annotations

import argparse
import json
import time
import urllib.request
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
SCENARIOS_DIR = REPO_ROOT / "demo" / "scenarios"


def load_scenario(name: str) -> dict:
    path = SCENARIOS_DIR / (name if name.endswith(".json") else f"{name}.json")
    if not path.exists():
        available = ", ".join(sorted(p.stem for p in SCENARIOS_DIR.glob("*.json")))
        raise SystemExit(f"unknown scenario '{name}'. Available: {available}")
    return json.loads(path.read_text())


def timeline(scenario: dict) -> list[tuple[int, dict]]:
    """Ordered (t_seconds, step) pairs."""
    steps = [(int(s.get("t_seconds", 0)), s) for s in scenario["steps"]]
    return sorted(steps, key=lambda x: x[0])


def _describe(step: dict) -> str:
    for key in ("inject", "inject_proximity", "inject_weather"):
        if key in step:
            return f"{key} {json.dumps(step[key])}"
    if step.get("operator_action"):
        return f"operator_action {step['operator_action']}"
    if step.get("stop_feed"):
        return "stop_feed (telemetry disconnect)"
    return "(marker)"


def dry_run(scenario: dict) -> None:
    print(f"# {scenario['id']} - {scenario['title']}")
    print(f"  machine={scenario.get('machine_id')} operator={scenario.get('operator_id')} "
          f"provenance={scenario['provenance']}")
    for t, step in timeline(scenario):
        line = f"  t+{t:>3}s  {_describe(step)}"
        if "expect" in step:
            line += f"   => expect {json.dumps(step['expect'])}"
        print(line)
    print("  (dry-run: nothing sent)")


def _post_ingest(base_url: str, machine_id: str, operator_id: str, fields: dict) -> None:
    reading = {"idempotency_key": f"{machine_id}-{int(time.time()*1000)}",
               "machine_id": machine_id, "operator_id": operator_id, **fields}
    body = json.dumps({"readings": [reading]}).encode()
    req = urllib.request.Request(f"{base_url}/api/v1/telemetry/ingest", data=body,
                                 headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=5) as resp:  # noqa: S310 (local demo url)
        print(f"    ingest -> {resp.status}")


def live_run(scenario: dict, base_url: str, speed: float) -> None:
    machine_id = scenario.get("machine_id", "EXC001")
    operator_id = scenario.get("operator_id", "OP1001")
    prev_t = 0
    for t, step in timeline(scenario):
        delay = max(0.0, (t - prev_t) / speed)
        time.sleep(delay)
        prev_t = t
        if "inject" in step:
            try:
                _post_ingest(base_url, machine_id, operator_id, step["inject"])
            except Exception as exc:  # keep the demo moving; report clearly
                print(f"    t+{t}s ingest failed: {exc} (is the backend up?)")
        else:
            # proximity/weather/operator_action need dedicated endpoints; log for now.
            print(f"    t+{t}s {_describe(step)}  [not yet wired — pending backend]")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("scenario", help="scenario id (filename without .json)")
    ap.add_argument("--live", action="store_true", help="send to the backend (default: dry-run)")
    ap.add_argument("--base-url", default="http://localhost:8000", help="backend base URL")
    ap.add_argument("--speed", type=float, default=1.0, help="time compression factor")
    args = ap.parse_args()

    scenario = load_scenario(args.scenario)
    if args.live:
        live_run(scenario, args.base_url, args.speed)
    else:
        dry_run(scenario)


if __name__ == "__main__":
    main()
