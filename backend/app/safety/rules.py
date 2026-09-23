"""Deterministic safety rules. Owner: Claude 1. HIGHEST-PRIORITY subsystem.

CRITICAL CONTRACT (see CLAUDE.md / ADR-0001):
- Safety events are decided here by deterministic rules on validated telemetry.
- An LLM NEVER decides whether a hazard exists. The assistant only *explains*
  events these rules already produced.
- Each rule is pure and independently unit-tested (positive / negative / boundary).

This module ships one reference rule (seatbelt) to establish the pattern. The
remaining rules — proximity, restricted-zone, overspeed, unsafe-slope,
sudden-movement — follow the same shape.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class Severity(str, Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


@dataclass(frozen=True)
class TelemetrySample:
    """Validated, normalized telemetry the rules evaluate. Mirrors DATA_MODEL."""
    machine_id: str
    operator_id: str
    seatbelt_status: str  # "FASTENED" | "UNFASTENED"
    machine_state: str    # "IDLE" | "OPERATING" | "OFF" | "MAINTENANCE"
    speed: float = 0.0


@dataclass(frozen=True)
class SafetyEvent:
    type: str
    severity: Severity
    machine_id: str
    operator_id: str
    recommended_action: str


# Tunable thresholds live here, not scattered through the code.
PROXIMITY_WORKER_THRESHOLD_M = 5.0
OVERSPEED_THRESHOLD = 15.0
IDLE_EXCESSIVE_MINUTES = 45


def evaluate_seatbelt(sample: TelemetrySample) -> SafetyEvent | None:
    """HIGH event iff seatbelt is unfastened while the machine is operating.

    IF seatbelt == UNFASTENED AND machine_state == OPERATING -> safety event.
    """
    if sample.seatbelt_status == "UNFASTENED" and sample.machine_state == "OPERATING":
        return SafetyEvent(
            type="SEATBELT_UNFASTENED",
            severity=Severity.HIGH,
            machine_id=sample.machine_id,
            operator_id=sample.operator_id,
            recommended_action="Fasten seatbelt before operating the machine.",
        )
    return None


# Registry of rules the safety engine runs over each validated sample.
RULES = (evaluate_seatbelt,)


def evaluate_all(sample: TelemetrySample) -> list[SafetyEvent]:
    """Run every deterministic rule; return the events that fired."""
    events: list[SafetyEvent] = []
    for rule in RULES:
        event = rule(sample)
        if event is not None:
            events.append(event)
    return events
