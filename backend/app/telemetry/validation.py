"""Telemetry validation + normalization. Owner: Claude 1.

Impossible/out-of-range readings are quarantined (stored flagged, not evaluated)
rather than trusted as live. See docs/ARCHITECTURE.md §9.
"""
from __future__ import annotations

from app.schemas.telemetry import TelemetryReading

_VALID_SEATBELT = {"FASTENED", "UNFASTENED", None}
_VALID_STATE = {"IDLE", "OPERATING", "OFF", "MAINTENANCE", None}

# (field, min, max) — physically plausible envelopes.
_RANGES = [
    ("engine_temperature", -40.0, 200.0),
    ("hydraulic_pressure", 0.0, 600.0),
    ("speed", 0.0, 200.0),
    ("fuel_used", 0.0, 10_000.0),
    ("fuel_rate", 0.0, 1_000.0),
    ("engine_load", 0.0, 1.5),
    ("idle_time", 0.0, 1_440.0),
    ("cycle_time", 0.0, 3_600.0),
    ("latitude", -90.0, 90.0),
    ("longitude", -180.0, 180.0),
]


def validate_reading(reading: TelemetryReading) -> tuple[bool, str | None]:
    """Return (ok, reason). ok=False means quarantine."""
    if reading.seatbelt_status not in _VALID_SEATBELT:
        return False, f"invalid seatbelt_status={reading.seatbelt_status!r}"
    if reading.machine_state not in _VALID_STATE:
        return False, f"invalid machine_state={reading.machine_state!r}"
    for field, lo, hi in _RANGES:
        value = getattr(reading, field)
        if value is None:
            continue
        if value < lo or value > hi:
            return False, f"{field}={value} outside [{lo}, {hi}]"
    return True, None
