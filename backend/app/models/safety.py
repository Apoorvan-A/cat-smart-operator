"""Safety events, alerts, proximity events. Owner: Claude 1."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class SafetyEvent(Base):
    __tablename__ = "safety_event"

    id: Mapped[str] = mapped_column(String, primary_key=True)  # e.g. SE-9001
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, index=True)
    type: Mapped[str] = mapped_column(String, index=True)
    severity: Mapped[str] = mapped_column(String)  # INFO|WARNING|HIGH|CRITICAL
    machine_id: Mapped[str] = mapped_column(String, index=True)
    operator_id: Mapped[str] = mapped_column(String, index=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    telemetry_context: Mapped[dict] = mapped_column(JSON, default=dict)
    recommended_action: Mapped[str] = mapped_column(String, default="")
    acknowledged: Mapped[bool] = mapped_column(Boolean, default=False)
    provenance: Mapped[str] = mapped_column(String, default="SIMULATED")
    alert_id: Mapped[str | None] = mapped_column(ForeignKey("alert.id"), nullable=True)


class Alert(Base):
    __tablename__ = "alert"

    id: Mapped[str] = mapped_column(String, primary_key=True)  # e.g. AL-501
    severity: Mapped[str] = mapped_column(String)
    # CREATED|ACTIVE|ACKNOWLEDGED|RESOLVED|ESCALATED
    status: Mapped[str] = mapped_column(String, default="ACTIVE")
    count: Mapped[int] = mapped_column(Integer, default=1)
    grouped_event_ids: Mapped[list] = mapped_column(JSON, default=list)
    summary: Mapped[str] = mapped_column(String, default="")
    machine_id: Mapped[str] = mapped_column(String, index=True)
    type: Mapped[str] = mapped_column(String, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    acknowledged_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    acknowledged_by: Mapped[str | None] = mapped_column(String, nullable=True)
    escalated_to: Mapped[str | None] = mapped_column(String, nullable=True)


class ProximityEvent(Base):
    __tablename__ = "proximity_event"

    id: Mapped[str] = mapped_column(String, primary_key=True)  # e.g. PX-1
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, index=True)
    machine_id: Mapped[str] = mapped_column(String, index=True)
    entity_type: Mapped[str] = mapped_column(String)  # WORKER|VEHICLE|MACHINE
    entity_id: Mapped[str] = mapped_column(String)
    distance_m: Mapped[float] = mapped_column(Float)
    threshold_m: Mapped[float] = mapped_column(Float)
    provenance: Mapped[str] = mapped_column(String, default="SIMULATED")
