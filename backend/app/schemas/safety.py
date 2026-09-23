"""Safety + alert schemas. Owner: Claude 1."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class Location(BaseModel):
    lat: float | None = None
    lng: float | None = None


class SafetyEventOut(BaseModel):
    id: str
    timestamp: datetime
    type: str
    severity: str
    machine_id: str
    operator_id: str
    location: Location = Location()
    telemetry_context: dict = {}
    provenance: str = "SIMULATED"
    recommended_action: str = ""
    acknowledged: bool = False


class AlertOut(BaseModel):
    id: str
    severity: str
    status: str
    count: int
    grouped_event_ids: list[str] = []
    summary: str = ""
    machine_id: str
    type: str
    created_at: datetime

    model_config = {"from_attributes": True}


class AckRequest(BaseModel):
    note: str | None = None


class EscalateRequest(BaseModel):
    to_role: str
