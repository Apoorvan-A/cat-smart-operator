"""Task + ETA schemas. Owner: Claude 1."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel

from app.schemas.common import Explanation


class TaskOut(BaseModel):
    id: str
    title: str
    type: str
    priority: str
    site_id: str
    machine_id: str | None = None
    operator_id: str | None = None
    state: str
    progress: float
    scheduled_start: datetime | None = None
    original_eta: datetime | None = None
    predicted_eta: datetime | None = None
    eta_provenance: str = "PREDICTED"

    model_config = {"from_attributes": True}


class EtaResponse(BaseModel):
    task_id: str
    predicted_eta: datetime | None
    delta_minutes: float
    provenance: str
    explanation: Explanation
    fallback_used: bool
