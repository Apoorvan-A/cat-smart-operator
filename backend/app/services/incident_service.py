"""Incident service with timeline reconstruction. Owner: Claude 1.

Answers "what was happening immediately before the incident?" by gathering
telemetry, nearby safety events, and weather around the event time.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.ops import Incident
from app.models.safety import SafetyEvent
from app.models.telemetry import Telemetry, WeatherRecord
from app.schemas.misc import IncidentCreate
from app.services.ids import new_id

WINDOW = timedelta(minutes=5)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _reconstruct_timeline(db: Session, machine_id: str, at: datetime) -> list[dict]:
    lo, hi = at - WINDOW, at + WINDOW
    timeline: list[dict] = []

    for t in db.execute(
        select(Telemetry).where(Telemetry.machine_id == machine_id,
                                Telemetry.timestamp >= lo, Telemetry.timestamp <= hi)
        .order_by(Telemetry.timestamp)
    ).scalars().all():
        timeline.append({"kind": "telemetry", "timestamp": t.timestamp.isoformat(),
                         "machine_state": t.machine_state, "speed": t.speed,
                         "seatbelt_status": t.seatbelt_status})

    for e in db.execute(
        select(SafetyEvent).where(SafetyEvent.machine_id == machine_id,
                                  SafetyEvent.timestamp >= lo, SafetyEvent.timestamp <= hi)
        .order_by(SafetyEvent.timestamp)
    ).scalars().all():
        timeline.append({"kind": "safety_event", "timestamp": e.timestamp.isoformat(),
                         "type": e.type, "severity": e.severity})

    w = db.execute(
        select(WeatherRecord).where(WeatherRecord.timestamp <= hi)
        .order_by(WeatherRecord.timestamp.desc())
    ).scalars().first()
    if w:
        timeline.append({"kind": "weather", "timestamp": w.timestamp.isoformat(),
                         "rainfall": w.rainfall, "visibility": w.visibility})

    timeline.sort(key=lambda x: x["timestamp"])
    return timeline


def create(db: Session, payload: IncidentCreate) -> Incident:
    occurred = payload.occurred_at or _utcnow()
    if occurred.tzinfo is None:
        occurred = occurred.replace(tzinfo=timezone.utc)
    incident = Incident(
        id=new_id("INC"),
        machine_id=payload.machine_id,
        operator_id=payload.operator_id,
        type=payload.type,
        description=payload.description,
        occurred_at=occurred,
        timeline=_reconstruct_timeline(db, payload.machine_id, occurred),
    )
    db.add(incident)
    db.commit()
    return incident


def get(db: Session, incident_id: str) -> Incident | None:
    return db.get(Incident, incident_id)
