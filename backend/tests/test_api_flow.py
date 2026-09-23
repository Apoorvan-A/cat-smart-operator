"""End-to-end API flow tests (SQLite). Owner: Claude 1.

Covers the safety vertical slice: login -> ingest -> safety event -> alert ->
acknowledge, plus duplicate/quarantine handling and the grounded assistant.
"""
from datetime import datetime, timezone


def _reading(key: str, **kw) -> dict:
    base = dict(idempotency_key=key, timestamp=datetime.now(timezone.utc).isoformat(),
                machine_id="EXC001", operator_id="OP1001",
                seatbelt_status="FASTENED", machine_state="OPERATING")
    base.update(kw)
    return base


def test_login_and_me(client):
    r = client.post("/api/v1/auth/login", json={"username": "OP1001", "password": "demo"})
    assert r.status_code == 200
    token = r.json()["access_token"]
    me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200 and me.json()["id"] == "OP1001"
    assert me.json()["current_machine_id"] == "EXC001"


def test_login_bad_password(client):
    r = client.post("/api/v1/auth/login", json={"username": "OP1001", "password": "wrong"})
    assert r.status_code == 401 and r.json()["error"]["code"] == "UNAUTHORIZED"


def test_seatbelt_violation_creates_alert_and_acknowledge(client, auth):
    # Ingest a seatbelt-unfastened-while-operating reading.
    r = client.post("/api/v1/telemetry/ingest",
                    json={"readings": [_reading("k-seatbelt", seatbelt_status="UNFASTENED")]},
                    headers=auth)
    assert r.status_code == 200 and r.json()["accepted"] == 1

    alerts = client.get("/api/v1/safety/alerts", headers=auth).json()
    assert any(a["type"] == "SEATBELT_UNFASTENED" and a["severity"] == "HIGH" for a in alerts)

    alert_id = alerts[0]["id"]
    ack = client.post(f"/api/v1/safety/alerts/{alert_id}/acknowledge",
                      json={"note": "belt fastened"}, headers=auth)
    assert ack.status_code == 200 and ack.json()["status"] == "ACKNOWLEDGED"


def test_duplicate_and_quarantine(client, auth):
    good = _reading("dup-1", seatbelt_status="FASTENED")
    bad = _reading("bad-1", engine_temperature=999.0)  # impossible -> quarantine
    r = client.post("/api/v1/telemetry/ingest",
                    json={"readings": [good, good, bad]}, headers=auth)
    body = r.json()
    assert body["accepted"] == 1 and body["duplicates"] == 1 and body["quarantined"] == 1


def test_proximity_hazard_creates_high_alert(client, auth):
    r = client.post("/api/v1/safety/proximity",
                    json={"machine_id": "EXC001", "operator_id": "OP1001",
                          "entity_type": "WORKER", "entity_id": "W103", "distance_m": 3.2},
                    headers=auth)
    assert r.status_code == 200 and r.json()["severity"] == "HIGH"


def test_predict_eta_returns_explanation(client, auth):
    r = client.post("/api/v1/tasks/T-101/predict-eta", headers=auth)
    assert r.status_code == 200
    body = r.json()
    assert "predicted_eta" in body and body["explanation"]["what"]


def test_assistant_is_grounded(client, auth):
    r = client.post("/api/v1/assistant/query",
                    json={"operator_id": "OP1001", "question": "Why is my task delayed?"},
                    headers=auth)
    assert r.status_code == 200 and r.json()["grounded"] is True


def test_telemetry_stale_when_no_recent_data(client, auth):
    # A machine with no telemetry should report stale, not fake live data.
    r = client.get("/api/v1/machines/EXC001/telemetry", headers=auth)
    assert r.status_code == 200
    assert "stale" in r.json()
