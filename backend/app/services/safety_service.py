"""Safety service: turn fired rules into persisted events + alerts. Owner: Claude 1.

Deterministic chain (ADR-0001): rule fires -> SafetyEvent persisted -> Alert
created/grouped -> WebSocket push -> audit. The LLM is never involved here.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.safety import Alert, ProximityEvent, SafetyEvent
from app.safety import rules
from app.services import audit
from app.services.ids import new_id
from app.websocket.hub import hub

GROUP_WINDOW_SECONDS = 120  # related events within this window collapse into one alert


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _alert_payload(alert: Alert) -> dict:
    return {
        "id": alert.id, "severity": alert.severity, "status": alert.status,
        "count": alert.count, "grouped_event_ids": alert.grouped_event_ids,
        "summary": alert.summary, "machine_id": alert.machine_id, "type": alert.type,
    }


def _persist_event(db: Session, ev: rules.SafetyEvent, *, context: dict,
                   lat: float | None, lng: float | None) -> SafetyEvent:
    row = SafetyEvent(
        id=new_id("SE"),
        timestamp=_utcnow(),
        type=ev.type,
        severity=ev.severity.value,
        machine_id=ev.machine_id,
        operator_id=ev.operator_id,
        latitude=lat,
        longitude=lng,
        telemetry_context={**context, **ev.context},
        recommended_action=ev.recommended_action,
        provenance="SIMULATED",
    )
    db.add(row)
    db.flush()
    return row


def _attach_alert(db: Session, event: SafetyEvent) -> Alert:
    """Group into an active alert of the same type+machine within the window, else create."""
    cutoff = _utcnow() - timedelta(seconds=GROUP_WINDOW_SECONDS)
    existing = db.execute(
        select(Alert).where(
            Alert.machine_id == event.machine_id,
            Alert.type == event.type,
            Alert.status.in_(("CREATED", "ACTIVE")),
            Alert.created_at >= cutoff,
        ).order_by(Alert.created_at.desc())
    ).scalars().first()

    if existing:
        existing.count += 1
        existing.grouped_event_ids = [*existing.grouped_event_ids, event.id]
        existing.summary = (f"{existing.count} related {event.type} events "
                            f"in the last {GROUP_WINDOW_SECONDS // 60} min")
        # Escalate severity to the most severe seen.
        existing.severity = _max_severity(existing.severity, event.severity)
        event.alert_id = existing.id
        db.flush()
        return existing

    alert = Alert(
        id=new_id("AL"),
        severity=event.severity,
        status="ACTIVE",
        count=1,
        grouped_event_ids=[event.id],
        summary=f"{event.type} on {event.machine_id}",
        machine_id=event.machine_id,
        type=event.type,
        created_at=_utcnow(),
    )
    db.add(alert)
    db.flush()
    event.alert_id = alert.id
    db.flush()
    return alert


_ORDER = {"INFO": 0, "WARNING": 1, "HIGH": 2, "CRITICAL": 3}


def _max_severity(a: str, b: str) -> str:
    return a if _ORDER.get(a, 0) >= _ORDER.get(b, 0) else b


def process_sample(db: Session, sample: rules.TelemetrySample, *,
                   context: dict, lat: float | None = None,
                   lng: float | None = None) -> list[SafetyEvent]:
    """Evaluate all sample-based rules; persist + alert + push each fired event."""
    persisted: list[SafetyEvent] = []
    for ev in rules.evaluate_all(sample):
        row = _persist_event(db, ev, context=context, lat=lat, lng=lng)
        alert = _attach_alert(db, row)
        hub.broadcast_sync({"type": "SAFETY_ALERT", "payload": _alert_payload(alert)})
        persisted.append(row)
    return persisted


def process_proximity(db: Session, *, machine_id: str, operator_id: str,
                      entity_type: str, entity_id: str, distance_m: float,
                      threshold_m: float | None = None) -> SafetyEvent | None:
    """Record a proximity reading and, if it breaches the threshold, a safety event."""
    db.add(ProximityEvent(
        id=new_id("PX"), timestamp=_utcnow(), machine_id=machine_id,
        entity_type=entity_type, entity_id=entity_id, distance_m=distance_m,
        threshold_m=threshold_m or 0.0,
    ))
    ev = rules.evaluate_proximity(machine_id, operator_id, entity_type, entity_id,
                                  distance_m, threshold_m)
    if ev is None:
        db.flush()
        return None
    row = _persist_event(db, ev, context={"source": "proximity"}, lat=None, lng=None)
    alert = _attach_alert(db, row)
    hub.broadcast_sync({"type": "SAFETY_ALERT", "payload": _alert_payload(alert)})
    return row


def acknowledge(db: Session, alert_id: str, *, user_id: str, note: str | None) -> Alert | None:
    alert = db.get(Alert, alert_id)
    if alert is None:
        return None
    alert.status = "ACKNOWLEDGED"
    alert.acknowledged_at = _utcnow()
    alert.acknowledged_by = user_id
    for ev_id in alert.grouped_event_ids:
        ev = db.get(SafetyEvent, ev_id)
        if ev:
            ev.acknowledged = True
    audit.record(db, actor=user_id, action="ACKNOWLEDGE_ALERT",
                 entity_type="alert", entity_id=alert_id, detail={"note": note})
    db.flush()
    return alert


def escalate(db: Session, alert_id: str, *, to_role: str, user_id: str) -> Alert | None:
    alert = db.get(Alert, alert_id)
    if alert is None:
        return None
    alert.status = "ESCALATED"
    alert.escalated_to = to_role
    audit.record(db, actor=user_id, action="ESCALATE_ALERT",
                 entity_type="alert", entity_id=alert_id, detail={"to_role": to_role})
    db.flush()
    return alert
