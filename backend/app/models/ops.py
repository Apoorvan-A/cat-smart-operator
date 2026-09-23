"""Incidents, maintenance, audit log, shift handover. Owner: Claude 1."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Incident(Base):
    __tablename__ = "incident"

    id: Mapped[str] = mapped_column(String, primary_key=True)  # e.g. INC-1
    machine_id: Mapped[str] = mapped_column(String, index=True)
    operator_id: Mapped[str] = mapped_column(String, index=True)
    type: Mapped[str] = mapped_column(String, default="NEAR_MISS")
    description: Mapped[str] = mapped_column(String, default="")
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    timeline: Mapped[list] = mapped_column(JSON, default=list)
    notes: Mapped[str] = mapped_column(String, default="")
    review_status: Mapped[str] = mapped_column(String, default="OPEN")  # OPEN|REVIEWED
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)


class MaintenanceEvent(Base):
    __tablename__ = "maintenance_event"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    machine_id: Mapped[str] = mapped_column(String, index=True)
    type: Mapped[str] = mapped_column(String)
    scheduled_completion: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String, default="SCHEDULED")
    notes: Mapped[str] = mapped_column(String, default="")


class AuditLog(Base):
    __tablename__ = "audit_log"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, index=True)
    actor: Mapped[str] = mapped_column(String)
    action: Mapped[str] = mapped_column(String)
    entity_type: Mapped[str] = mapped_column(String)
    entity_id: Mapped[str] = mapped_column(String)
    detail: Mapped[dict] = mapped_column(JSON, default=dict)


class ShiftHandover(Base):
    __tablename__ = "shift_handover"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    shift_id: Mapped[str] = mapped_column(ForeignKey("shift.id"), index=True)
    summary: Mapped[dict] = mapped_column(JSON, default=dict)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
