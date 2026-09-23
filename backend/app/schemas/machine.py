"""Machine + health schemas. Owner: Claude 1."""
from __future__ import annotations

from pydantic import BaseModel

from app.schemas.common import Explanation


class MachineOut(BaseModel):
    id: str
    type: str
    model: str
    site_id: str
    status: str
    engine_hours: float

    model_config = {"from_attributes": True}


class HealthSignal(BaseModel):
    name: str
    value: float
    unit: str
    state: str  # NORMAL|WARNING|DEGRADED|CRITICAL


class HealthOut(BaseModel):
    machine_id: str
    state: str
    health_score: float
    provenance: str
    signals: list[HealthSignal]
    explanation: Explanation
    fallback_used: bool = False
