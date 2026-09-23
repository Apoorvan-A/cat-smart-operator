"""Safety-rule unit tests. Owner: Claude 1. Highest-priority tests (ADR-0001).

Each rule: positive / negative / boundary.
"""
from app.safety.rules import (
    Severity,
    TelemetrySample,
    evaluate_all,
    evaluate_overspeed,
    evaluate_proximity,
    evaluate_seatbelt,
    evaluate_sudden_movement,
    evaluate_unsafe_slope,
)


def _sample(**kw) -> TelemetrySample:
    base = dict(machine_id="EXC001", operator_id="OP1001",
                seatbelt_status="FASTENED", machine_state="OPERATING", speed=0.0)
    base.update(kw)
    return TelemetrySample(**base)


# --- Seatbelt ---
def test_seatbelt_unfastened_operating_fires_high():
    ev = evaluate_seatbelt(_sample(seatbelt_status="UNFASTENED"))
    assert ev and ev.type == "SEATBELT_UNFASTENED" and ev.severity is Severity.HIGH


def test_seatbelt_unfastened_idle_does_not_fire():
    assert evaluate_seatbelt(_sample(seatbelt_status="UNFASTENED", machine_state="IDLE")) is None


def test_seatbelt_fastened_does_not_fire():
    assert evaluate_seatbelt(_sample()) is None


# --- Overspeed ---
def test_overspeed_warning_over_limit():
    ev = evaluate_overspeed(_sample(speed=16.0, overspeed_limit=15.0))
    assert ev and ev.severity is Severity.WARNING


def test_overspeed_high_beyond_factor():
    ev = evaluate_overspeed(_sample(speed=20.0, overspeed_limit=15.0))  # >1.3x
    assert ev and ev.severity is Severity.HIGH


def test_overspeed_at_limit_does_not_fire():
    assert evaluate_overspeed(_sample(speed=15.0, overspeed_limit=15.0)) is None


# --- Unsafe slope ---
def test_unsafe_slope_fires_when_operating():
    ev = evaluate_unsafe_slope(_sample(slope_deg=35.0))
    assert ev and ev.severity is Severity.HIGH


def test_unsafe_slope_ignored_when_idle():
    assert evaluate_unsafe_slope(_sample(slope_deg=35.0, machine_state="IDLE")) is None


# --- Sudden movement ---
def test_sudden_movement_fires_on_sharp_change():
    ev = evaluate_sudden_movement(_sample(speed=10.0, prev_speed=0.0, dt_seconds=1.0))
    assert ev and ev.severity is Severity.WARNING


def test_sudden_movement_ignored_outside_window():
    assert evaluate_sudden_movement(_sample(speed=10.0, prev_speed=0.0, dt_seconds=10.0)) is None


def test_sudden_movement_needs_history():
    assert evaluate_sudden_movement(_sample(speed=10.0)) is None


# --- Proximity ---
def test_worker_proximity_high_under_threshold():
    ev = evaluate_proximity("EXC001", "OP1001", "WORKER", "W1", 3.2)
    assert ev and ev.severity is Severity.HIGH


def test_worker_proximity_critical_very_close():
    ev = evaluate_proximity("EXC001", "OP1001", "WORKER", "W1", 1.5)
    assert ev and ev.severity is Severity.CRITICAL


def test_worker_proximity_safe_distance():
    assert evaluate_proximity("EXC001", "OP1001", "WORKER", "W1", 6.0) is None


def test_vehicle_proximity_high():
    ev = evaluate_proximity("EXC001", "OP1001", "VEHICLE", "V1", 5.0)
    assert ev and ev.severity is Severity.HIGH


# --- Aggregate ---
def test_evaluate_all_collects_multiple():
    events = evaluate_all(_sample(seatbelt_status="UNFASTENED", speed=25.0, overspeed_limit=15.0))
    types = {e.type for e in events}
    assert "SEATBELT_UNFASTENED" in types and "OVERSPEED" in types
