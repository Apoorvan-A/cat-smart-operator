"""Telemetry validation tests. Owner: Claude 1."""
from datetime import datetime, timezone

from app.schemas.telemetry import TelemetryReading
from app.telemetry.validation import validate_reading


def _reading(**kw) -> TelemetryReading:
    base = dict(idempotency_key="k1", timestamp=datetime.now(timezone.utc),
                machine_id="EXC001", operator_id="OP1001",
                seatbelt_status="FASTENED", machine_state="OPERATING")
    base.update(kw)
    return TelemetryReading(**base)


def test_valid_reading_passes():
    ok, reason = validate_reading(_reading(engine_temperature=95.0, speed=10.0))
    assert ok and reason is None


def test_impossible_temperature_quarantined():
    ok, reason = validate_reading(_reading(engine_temperature=500.0))
    assert not ok and "engine_temperature" in reason


def test_negative_speed_quarantined():
    ok, _ = validate_reading(_reading(speed=-5.0))
    assert not ok


def test_bad_seatbelt_value_quarantined():
    ok, _ = validate_reading(_reading(seatbelt_status="MAYBE"))
    assert not ok


def test_none_fields_are_allowed():
    ok, _ = validate_reading(_reading(engine_temperature=None, speed=None))
    assert ok
