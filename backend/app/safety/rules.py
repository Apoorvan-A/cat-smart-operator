"""Deterministic safety rules. Owner: Claude 1. HIGHEST-PRIORITY subsystem.

CRITICAL CONTRACT (CLAUDE.md / ADR-0001):
- Safety events are decided here by deterministic rules on validated telemetry.
- An LLM NEVER decides whether a hazard exists; the assistant only *explains*
  events these rules already produced.
- Each rule is pure and independently unit-tested (positive / negative / boundary).

Rules that read a single telemetry sample live in ``evaluate_all``. Proximity is
evaluated from its own event stream via ``evaluate_proximity``.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum


class Severity(str, Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


# --- Tunable thresholds (kept in one place, not scattered) ---
PROXIMITY_WORKER_THRESHOLD_M = 5.0
PROXIMITY_WORKER_CRITICAL_M = 2.0
PROXIMITY_VEHICLE_THRESHOLD_M = 8.0
DEFAULT_OVERSPEED_LIMIT = 15.0        # km/h; site-configurable via sample
OVERSPEED_HIGH_FACTOR = 1.3
UNSAFE_SLOPE_DEG = 30.0
SUDDEN_MOVEMENT_DELTA = 8.0           # km/h change...
SUDDEN_MOVEMENT_WINDOW_S = 2.0        # ...within this many seconds


@dataclass(frozen=True)
class TelemetrySample:
    """Validated, normalized telemetry the rules evaluate."""
    machine_id: str
    operator_id: str
    seatbelt_status: str = "FASTENED"       # FASTENED | UNFASTENED
    machine_state: str = "IDLE"             # IDLE | OPERATING | OFF | MAINTENANCE
    speed: float = 0.0
    overspeed_limit: float = DEFAULT_OVERSPEED_LIMIT
    slope_deg: float = 0.0
    prev_speed: float | None = None
    dt_seconds: float | None = None


@dataclass(frozen=True)
class SafetyEvent:
    type: str
    severity: Severity
    machine_id: str
    operator_id: str
    recommended_action: str
    context: dict = field(default_factory=dict)


def _operating(sample: TelemetrySample) -> bool:
    return sample.machine_state == "OPERATING"


def evaluate_seatbelt(sample: TelemetrySample) -> SafetyEvent | None:
    """HIGH iff seatbelt unfastened while operating."""
    if sample.seatbelt_status == "UNFASTENED" and _operating(sample):
        return SafetyEvent(
            type="SEATBELT_UNFASTENED",
            severity=Severity.HIGH,
            machine_id=sample.machine_id,
            operator_id=sample.operator_id,
            recommended_action="Fasten seatbelt before operating the machine.",
        )
    return None


def evaluate_overspeed(sample: TelemetrySample) -> SafetyEvent | None:
    """WARNING over the limit; HIGH beyond 1.3x the limit."""
    limit = sample.overspeed_limit
    if sample.speed <= limit:
        return None
    severity = Severity.HIGH if sample.speed > limit * OVERSPEED_HIGH_FACTOR else Severity.WARNING
    return SafetyEvent(
        type="OVERSPEED",
        severity=severity,
        machine_id=sample.machine_id,
        operator_id=sample.operator_id,
        recommended_action="Reduce speed to within the site limit.",
        context={"speed": sample.speed, "limit": limit},
    )


def evaluate_unsafe_slope(sample: TelemetrySample) -> SafetyEvent | None:
    """HIGH iff slope exceeds the safe limit while operating."""
    if _operating(sample) and sample.slope_deg > UNSAFE_SLOPE_DEG:
        return SafetyEvent(
            type="UNSAFE_SLOPE",
            severity=Severity.HIGH,
            machine_id=sample.machine_id,
            operator_id=sample.operator_id,
            recommended_action="Reposition the machine; slope exceeds the safe limit.",
            context={"slope_deg": sample.slope_deg, "limit": UNSAFE_SLOPE_DEG},
        )
    return None


def evaluate_sudden_movement(sample: TelemetrySample) -> SafetyEvent | None:
    """WARNING iff speed changed sharply over a short window."""
    if sample.prev_speed is None or sample.dt_seconds is None:
        return None
    if sample.dt_seconds <= 0 or sample.dt_seconds > SUDDEN_MOVEMENT_WINDOW_S:
        return None
    if abs(sample.speed - sample.prev_speed) >= SUDDEN_MOVEMENT_DELTA:
        return SafetyEvent(
            type="SUDDEN_MOVEMENT",
            severity=Severity.WARNING,
            machine_id=sample.machine_id,
            operator_id=sample.operator_id,
            recommended_action="Operate smoothly; avoid abrupt speed changes.",
            context={"delta": abs(sample.speed - sample.prev_speed), "dt": sample.dt_seconds},
        )
    return None


def evaluate_proximity(
    machine_id: str,
    operator_id: str,
    entity_type: str,
    entity_id: str,
    distance_m: float,
    threshold_m: float | None = None,
) -> SafetyEvent | None:
    """Proximity hazard from the proximity stream.

    Worker: HIGH under 5 m, CRITICAL under 2 m. Vehicle/machine: HIGH under 8 m.
    """
    if entity_type == "WORKER":
        limit = threshold_m or PROXIMITY_WORKER_THRESHOLD_M
        if distance_m >= limit:
            return None
        severity = Severity.CRITICAL if distance_m < PROXIMITY_WORKER_CRITICAL_M else Severity.HIGH
        action = ("Stop immediately — worker inside the danger zone."
                  if severity is Severity.CRITICAL
                  else "Slow down — worker approaching the danger zone.")
    else:  # VEHICLE | MACHINE
        limit = threshold_m or PROXIMITY_VEHICLE_THRESHOLD_M
        if distance_m >= limit:
            return None
        severity = Severity.HIGH
        action = "Maintain safe distance from nearby equipment."

    return SafetyEvent(
        type="PROXIMITY_HAZARD",
        severity=severity,
        machine_id=machine_id,
        operator_id=operator_id,
        recommended_action=action,
        context={"entity_type": entity_type, "entity_id": entity_id,
                 "distance_m": distance_m, "threshold_m": limit},
    )


# Rules that read a single telemetry sample.
SAMPLE_RULES = (
    evaluate_seatbelt,
    evaluate_overspeed,
    evaluate_unsafe_slope,
    evaluate_sudden_movement,
)


def evaluate_all(sample: TelemetrySample) -> list[SafetyEvent]:
    """Run every sample-based rule; return the events that fired."""
    events: list[SafetyEvent] = []
    for rule in SAMPLE_RULES:
        event = rule(sample)
        if event is not None:
            events.append(event)
    return events
