"""Simulator runner tests. Owner: Claude 4. Runs with no services (dry-run path)."""
from __future__ import annotations

import importlib.util
import sys

import pytest

from conftest import REPO_ROOT, SCENARIOS_DIR

# Load simulator/run.py as a module without a package.
_spec = importlib.util.spec_from_file_location("sim_run", REPO_ROOT / "simulator" / "run.py")
sim = importlib.util.module_from_spec(_spec)
sys.modules["sim_run"] = sim
_spec.loader.exec_module(sim)

SCENARIO_IDS = sorted(p.stem for p in SCENARIOS_DIR.glob("*.json"))


@pytest.mark.parametrize("sid", SCENARIO_IDS)
def test_timeline_is_ordered_and_complete(sid):
    scenario = sim.load_scenario(sid)
    tl = sim.timeline(scenario)
    assert tl, f"{sid}: empty timeline"
    times = [t for t, _ in tl]
    assert times == sorted(times), f"{sid}: timeline not ordered"


@pytest.mark.parametrize("sid", SCENARIO_IDS)
def test_dry_run_does_not_raise(sid, capsys):
    sim.dry_run(sim.load_scenario(sid))
    out = capsys.readouterr().out
    assert "dry-run: nothing sent" in out


def test_unknown_scenario_raises():
    with pytest.raises(SystemExit):
        sim.load_scenario("does_not_exist")
