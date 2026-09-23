"""Reference safety-rule tests. Owner: Claude 1.

Every safety rule gets positive / negative / boundary cases. These are the
highest-priority tests in the repo (ADR-0001).
"""
from app.safety.rules import Severity, TelemetrySample, evaluate_all, evaluate_seatbelt


def _sample(**kw) -> TelemetrySample:
    base = dict(
        machine_id="EXC001",
        operator_id="OP1001",
        seatbelt_status="FASTENED",
        machine_state="OPERATING",
        speed=0.0,
    )
    base.update(kw)
    return TelemetrySample(**base)


def test_seatbelt_unfastened_while_operating_fires_high():
    event = evaluate_seatbelt(_sample(seatbelt_status="UNFASTENED", machine_state="OPERATING"))
    assert event is not None
    assert event.type == "SEATBELT_UNFASTENED"
    assert event.severity is Severity.HIGH


def test_seatbelt_unfastened_while_idle_does_not_fire():
    assert evaluate_seatbelt(_sample(seatbelt_status="UNFASTENED", machine_state="IDLE")) is None


def test_seatbelt_fastened_while_operating_does_not_fire():
    assert evaluate_seatbelt(_sample(seatbelt_status="FASTENED", machine_state="OPERATING")) is None


def test_evaluate_all_returns_list():
    events = evaluate_all(_sample(seatbelt_status="UNFASTENED", machine_state="OPERATING"))
    assert len(events) == 1
