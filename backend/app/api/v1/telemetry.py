"""Telemetry router. Owner: Claude 1."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user
from app.core.database import get_db
from app.models.core import Operator
from app.schemas.telemetry import IngestRequest, IngestResponse
from app.services import telemetry_service

router = APIRouter(prefix="/telemetry", tags=["telemetry"])


@router.post("/ingest", response_model=IngestResponse)
def ingest(
    payload: IngestRequest,
    db: Session = Depends(get_db),
    _: Operator = Depends(get_current_user),
) -> IngestResponse:
    return telemetry_service.ingest(db, payload)
