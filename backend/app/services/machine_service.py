"""Machine + health service. Owner: Claude 1.

Health is a deterministic threshold state machine (the fallback path). When the
ML health model is wired in, results upgrade to provenance PREDICTED; until then
they are ASSUMED with fallback_used=True (honest labeling, ADR-0005).
"""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.core import Machine
from app.models.telemetry import Telemetry
from app.schemas.common import Explanation
from app.schemas.machine import HealthOut, HealthSignal

_ORDER = {"NORMAL": 0, "WARNING": 1, "DEGRADED": 2, "CRITICAL": 3}


def get_machine(db: Session, machine_id: str) -> Machine | None:
    return db.get(Machine, machine_id)


def _temp_state(t: float) -> str:
    if t > 115:
        return "CRITICAL"
    if t > 108:
        return "DEGRADED"
    if t > 100:
        return "WARNING"
    return "NORMAL"


def _pressure_state(p: float) -> str:
    if p > 300 or p < 100:
        return "DEGRADED"
    if p > 280 or p < 130:
        return "WARNING"
    return "NORMAL"


def health(db: Session, machine_id: str) -> HealthOut | None:
    machine = db.get(Machine, machine_id)
    if machine is None:
        return None

    latest = db.execute(
        select(Telemetry).where(Telemetry.machine_id == machine_id, ~Telemetry.quarantined)
        .order_by(Telemetry.timestamp.desc())
    ).scalars().first()

    signals: list[HealthSignal] = []
    worst = "NORMAL"

    if latest and latest.engine_temperature is not None:
        st = _temp_state(latest.engine_temperature)
        worst = st if _ORDER[st] > _ORDER[worst] else worst
        signals.append(HealthSignal(name="engine_temperature",
                                    value=latest.engine_temperature, unit="C", state=st))
    if latest and latest.hydraulic_pressure is not None:
        st = _pressure_state(latest.hydraulic_pressure)
        worst = st if _ORDER[st] > _ORDER[worst] else worst
        signals.append(HealthSignal(name="hydraulic_pressure",
                                    value=latest.hydraulic_pressure, unit="bar", state=st))

    score = max(0.0, 1.0 - 0.25 * _ORDER[worst])
    if worst == "NORMAL":
        expl = Explanation(what="All monitored signals are within normal ranges.",
                           why="Latest telemetry shows nominal temperature and pressure.",
                           action="No action needed.")
    else:
        drivers = ", ".join(f"{s.name} ({s.state})" for s in signals if s.state != "NORMAL")
        expl = Explanation(what=f"Machine health is {worst}.",
                           why=f"Deviating signals: {drivers or 'n/a'}.",
                           action="Maintenance attention recommended — schedule an inspection."
                           if worst in ("DEGRADED", "CRITICAL")
                           else "Monitor the flagged signals.")

    return HealthOut(
        machine_id=machine_id,
        state=worst,
        health_score=round(score, 2),
        provenance="ASSUMED",     # deterministic fallback until ML health lands
        signals=signals,
        explanation=expl,
        fallback_used=True,
    )
