"""Live-stack smoke tests. Owner: Claude 4.

Skips automatically when the compose stack is not running (see conftest).
"""
from __future__ import annotations

import httpx
import pytest

pytestmark = pytest.mark.requires_stack


def test_backend_health(backend_url):
    r = httpx.get(f"{backend_url}/health", timeout=5.0)
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


def test_ml_health(ml_url):
    r = httpx.get(f"{ml_url}/health", timeout=5.0)
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


def test_ml_eta_shape(ml_url):
    """ML ETA endpoint returns the contract shape (docs/API_CONTRACT.md)."""
    payload = {
        "task_id": "T-101",
        "task_type": "EXCAVATION",
        "progress": 0.5,
        "recent_cycle_time": 45.0,
        "rainfall": 6.0,
    }
    r = httpx.post(f"{ml_url}/predict/eta", json=payload, timeout=5.0)
    assert r.status_code == 200
    body = r.json()
    assert body["task_id"] == "T-101"
    assert body["provenance"] == "PREDICTED"
    assert "predicted_minutes_remaining" in body
