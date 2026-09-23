"""Incident router. Owner: Claude 1."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user
from app.core.database import get_db
from app.core.errors import not_found
from app.models.core import Operator
from app.schemas.misc import IncidentCreate, IncidentOut
from app.services import incident_service

router = APIRouter(prefix="/incidents", tags=["incidents"])


@router.post("", response_model=IncidentOut)
def create(payload: IncidentCreate, db: Session = Depends(get_db),
           _: Operator = Depends(get_current_user)) -> IncidentOut:
    incident = incident_service.create(db, payload)
    return IncidentOut.model_validate(incident)


@router.get("/{incident_id}", response_model=IncidentOut)
def get(incident_id: str, db: Session = Depends(get_db),
        _: Operator = Depends(get_current_user)) -> IncidentOut:
    incident = incident_service.get(db, incident_id)
    if incident is None:
        raise not_found("Incident")
    return IncidentOut.model_validate(incident)
