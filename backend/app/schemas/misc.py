"""Incident, training, analytics, assistant schemas. Owner: Claude 1."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel

from app.schemas.common import Explanation


# --- Incidents ---
class IncidentCreate(BaseModel):
    machine_id: str
    operator_id: str
    type: str = "NEAR_MISS"
    description: str = ""
    occurred_at: datetime | None = None


class IncidentOut(BaseModel):
    id: str
    machine_id: str
    operator_id: str
    type: str
    description: str
    occurred_at: datetime
    timeline: list = []
    notes: str = ""
    review_status: str = "OPEN"

    model_config = {"from_attributes": True}


# --- Training ---
class TrainingRecordOut(BaseModel):
    module_id: str
    title: str
    status: str
    reason: str = ""
    provenance: str = "OBSERVED"
    completion: float = 0.0


# --- Analytics ---
class FuelOut(BaseModel):
    fuel_per_hour: float
    fuel_per_cycle: float
    idle_fuel_estimate: float
    baseline_fuel_per_cycle: float
    provenance: str = "OBSERVED"
    insight: Explanation


class ProductivityOut(BaseModel):
    cycles_per_hour: float
    idle_percentage: float
    task_completion_rate: float
    provenance: str = "OBSERVED"


# --- Assistant ---
class AssistantQuery(BaseModel):
    operator_id: str
    question: str


class AssistantResponse(BaseModel):
    answer: str
    grounded: bool
    facts_used: list[dict] = []
    provenance: str = "OBSERVED"
    data_available: bool = True
