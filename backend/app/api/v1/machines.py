"""Machine router. Owner: Claude 1."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user
from app.core.database import get_db
from app.core.errors import not_found
from app.models.core import Operator
from app.models.telemetry import Telemetry
from app.schemas.machine import HealthOut, MachineOut
from app.schemas.telemetry import TelemetryList, TelemetryRow
from app.services import machine_service, telemetry_service

router = APIRouter(prefix="/machines", tags=["machines"])


@router.get("/{machine_id}", response_model=MachineOut)
def get_machine(machine_id: str, db: Session = Depends(get_db),
                _: Operator = Depends(get_current_user)) -> MachineOut:
    machine = machine_service.get_machine(db, machine_id)
    if machine is None:
        raise not_found("Machine")
    return MachineOut.model_validate(machine)


@router.get("/{machine_id}/health", response_model=HealthOut)
def get_health(machine_id: str, db: Session = Depends(get_db),
               _: Operator = Depends(get_current_user)) -> HealthOut:
    result = machine_service.health(db, machine_id)
    if result is None:
        raise not_found("Machine")
    return result


@router.get("/{machine_id}/telemetry", response_model=TelemetryList)
def get_telemetry(machine_id: str, limit: int = 50, db: Session = Depends(get_db),
                  _: Operator = Depends(get_current_user)) -> TelemetryList:
    stale, age = telemetry_service.freshness(db, machine_id)
    rows = db.execute(
        select(Telemetry).where(Telemetry.machine_id == machine_id)
        .order_by(Telemetry.timestamp.desc()).limit(limit)
    ).scalars().all()
    return TelemetryList(
        stale=stale, last_update_age_seconds=age,
        rows=[TelemetryRow.model_validate(r) for r in rows],
    )
