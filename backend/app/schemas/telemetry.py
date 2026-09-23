"""Telemetry schemas. Owner: Claude 1. See docs/API_CONTRACT.md."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class TelemetryReading(BaseModel):
    idempotency_key: str
    timestamp: datetime
    machine_id: str
    operator_id: str
    engine_hours: float | None = None
    fuel_used: float | None = None
    fuel_rate: float | None = None
    load_cycles: int | None = None
    idle_time: float | None = None
    cycle_time: float | None = None
    engine_temperature: float | None = None
    hydraulic_pressure: float | None = None
    engine_load: float | None = None
    speed: float | None = None
    latitude: float | None = None
    longitude: float | None = None
    seatbelt_status: str | None = None
    warning_code: str | None = None
    machine_state: str | None = None


class IngestRequest(BaseModel):
    readings: list[TelemetryReading] = Field(min_length=1)


class IngestResponse(BaseModel):
    accepted: int
    duplicates: int
    quarantined: int


class TelemetryRow(TelemetryReading):
    quarantined: bool = False
    provenance: str = "SIMULATED"

    model_config = {"from_attributes": True}


class TelemetryList(BaseModel):
    stale: bool
    last_update_age_seconds: float | None
    rows: list[TelemetryRow]
