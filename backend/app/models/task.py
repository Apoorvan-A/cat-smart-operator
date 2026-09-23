"""Task + task events. Owner: Claude 1."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Task(Base):
    __tablename__ = "task"

    id: Mapped[str] = mapped_column(String, primary_key=True)  # e.g. T-101
    title: Mapped[str] = mapped_column(String)
    type: Mapped[str] = mapped_column(String, default="EXCAVATION")
    priority: Mapped[str] = mapped_column(String, default="MEDIUM")  # LOW|MEDIUM|HIGH
    site_id: Mapped[str] = mapped_column(String, default="SITE-A")
    machine_id: Mapped[str | None] = mapped_column(ForeignKey("machine.id"), nullable=True)
    operator_id: Mapped[str | None] = mapped_column(ForeignKey("operator.id"), nullable=True)
    # SCHEDULED|STARTED|IN_PROGRESS|AT_RISK|DELAYED|COMPLETED|CANCELLED
    state: Mapped[str] = mapped_column(String, default="SCHEDULED")
    progress: Mapped[float] = mapped_column(Float, default=0.0)
    scheduled_start: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    original_eta: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    predicted_eta: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    delay_reason: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)


class TaskEvent(Base):
    __tablename__ = "task_event"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    task_id: Mapped[str] = mapped_column(ForeignKey("task.id"), index=True)
    event_type: Mapped[str] = mapped_column(String)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    payload: Mapped[dict] = mapped_column(JSON, default=dict)
