"""Safety router. Owner: Claude 1."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user
from app.core.database import get_db
from app.core.errors import not_found
from app.models.core import Operator
from app.models.safety import Alert, SafetyEvent
from app.schemas.safety import (
    AckRequest,
    AlertOut,
    EscalateRequest,
    Location,
    SafetyEventOut,
)
from app.services import safety_service

router = APIRouter(prefix="/safety", tags=["safety"])


def _event_out(e: SafetyEvent) -> SafetyEventOut:
    return SafetyEventOut(
        id=e.id, timestamp=e.timestamp, type=e.type, severity=e.severity,
        machine_id=e.machine_id, operator_id=e.operator_id,
        location=Location(lat=e.latitude, lng=e.longitude),
        telemetry_context=e.telemetry_context, provenance=e.provenance,
        recommended_action=e.recommended_action, acknowledged=e.acknowledged,
    )


@router.get("/events", response_model=list[SafetyEventOut])
def events(
    machine_id: str | None = None,
    severity: str | None = None,
    db: Session = Depends(get_db),
    _: Operator = Depends(get_current_user),
) -> list[SafetyEventOut]:
    stmt = select(SafetyEvent).order_by(SafetyEvent.timestamp.desc())
    if machine_id:
        stmt = stmt.where(SafetyEvent.machine_id == machine_id)
    if severity:
        stmt = stmt.where(SafetyEvent.severity == severity)
    return [_event_out(e) for e in db.execute(stmt).scalars().all()]


@router.get("/alerts", response_model=list[AlertOut])
def alerts(
    status: str | None = None,
    db: Session = Depends(get_db),
    _: Operator = Depends(get_current_user),
) -> list[AlertOut]:
    stmt = select(Alert).order_by(Alert.created_at.desc())
    if status:
        stmt = stmt.where(Alert.status == status)
    return [AlertOut.model_validate(a) for a in db.execute(stmt).scalars().all()]


@router.post("/alerts/{alert_id}/acknowledge", response_model=AlertOut)
def acknowledge(
    alert_id: str,
    payload: AckRequest,
    db: Session = Depends(get_db),
    user: Operator = Depends(get_current_user),
) -> AlertOut:
    alert = safety_service.acknowledge(db, alert_id, user_id=user.id, note=payload.note)
    if alert is None:
        raise not_found("Alert")
    db.commit()
    return AlertOut.model_validate(alert)


@router.post("/alerts/{alert_id}/escalate", response_model=AlertOut)
def escalate(
    alert_id: str,
    payload: EscalateRequest,
    db: Session = Depends(get_db),
    user: Operator = Depends(get_current_user),
) -> AlertOut:
    alert = safety_service.escalate(db, alert_id, to_role=payload.to_role, user_id=user.id)
    if alert is None:
        raise not_found("Alert")
    db.commit()
    return AlertOut.model_validate(alert)


class ProximityIn(BaseModel):
    machine_id: str
    operator_id: str
    entity_type: str = "WORKER"
    entity_id: str
    distance_m: float
    threshold_m: float | None = None


@router.post("/proximity", response_model=SafetyEventOut | None)
def proximity(
    payload: ProximityIn,
    db: Session = Depends(get_db),
    _: Operator = Depends(get_current_user),
) -> SafetyEventOut | None:
    """Ingest a proximity reading (used by the simulator); may raise a safety event."""
    ev = safety_service.process_proximity(
        db, machine_id=payload.machine_id, operator_id=payload.operator_id,
        entity_type=payload.entity_type, entity_id=payload.entity_id,
        distance_m=payload.distance_m, threshold_m=payload.threshold_m,
    )
    db.commit()
    return _event_out(ev) if ev else None
