"""Validate the demo scenario files. Owner: Claude 4.

Runs with no services — guards demo/scenarios/*.json so a malformed scenario is
caught in CI before the demo. Keeps the scenario contract honest.
"""
from __future__ import annotations

import json

import pytest

from conftest import SCENARIOS_DIR

SCENARIO_FILES = sorted(SCENARIOS_DIR.glob("*.json"))
EXPECTED_IDS = {
    "seatbelt_violation",
    "proximity_hazard",
    "excessive_idling",
    "machine_health_anomaly",
    "task_delay",
    "missing_telemetry",
}
VALID_PROVENANCE = {"REAL", "SIMULATED", "ASSUMED", "PREDICTED", "OBSERVED"}


def test_scenarios_directory_not_empty():
    assert SCENARIO_FILES, "no demo scenarios found in demo/scenarios/"


def test_all_expected_scenarios_present():
    ids = {json.loads(f.read_text())["id"] for f in SCENARIO_FILES}
    missing = EXPECTED_IDS - ids
    assert not missing, f"missing demo scenarios: {sorted(missing)}"


@pytest.mark.parametrize("path", SCENARIO_FILES, ids=lambda p: p.stem)
def test_scenario_shape(path):
    data = json.loads(path.read_text())
    for key in ("id", "title", "description", "steps", "provenance"):
        assert key in data, f"{path.name} missing '{key}'"
    assert data["id"] == path.stem, f"{path.name}: id must match filename"
    assert data["provenance"] in VALID_PROVENANCE
    assert isinstance(data["steps"], list) and data["steps"], f"{path.name}: needs steps"
    for i, step in enumerate(data["steps"]):
        assert "t_seconds" in step or "operator_action" in step, (
            f"{path.name} step {i}: needs a t_seconds or operator_action"
        )
