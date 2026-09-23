"""ML client fallback tests. Owner: Claude 1. See ADR-0002.

The backend must never crash when the ML service is unavailable; it falls back to
a deterministic estimate marked ASSUMED + fallback_used.
"""
from app.ml import client


def test_eta_falls_back_when_ml_unreachable(monkeypatch):
    # Point the client at a dead address so the HTTP call fails fast.
    monkeypatch.setattr(client.settings, "ml_service_url", "http://127.0.0.1:0")
    result = client.predict_eta_minutes(
        task_id="T-1", task_type="EXCAVATION", progress=0.5,
        recent_cycle_time=45.0, rainfall=6.0,
    )
    assert result["fallback_used"] is True
    assert result["provenance"] == "ASSUMED"
    assert result["minutes"] > 0
    assert "rainfall increased cycle time" in result["factors"]
