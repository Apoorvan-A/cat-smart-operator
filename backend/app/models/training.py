"""Training modules + records. Owner: Claude 1."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class TrainingModule(Base):
    __tablename__ = "training_module"

    id: Mapped[str] = mapped_column(String, primary_key=True)  # e.g. TR-EXC-SAFE
    title: Mapped[str] = mapped_column(String)
    description: Mapped[str] = mapped_column(String, default="")
    machine_type: Mapped[str] = mapped_column(String, default="EXCAVATOR")
    video_url: Mapped[str] = mapped_column(String, default="")


class TrainingRecord(Base):
    __tablename__ = "training_record"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    operator_id: Mapped[str] = mapped_column(ForeignKey("operator.id"), index=True)
    module_id: Mapped[str] = mapped_column(ForeignKey("training_module.id"), index=True)
    # RECOMMENDED|IN_PROGRESS|COMPLETED|NOT_STARTED
    status: Mapped[str] = mapped_column(String, default="NOT_STARTED")
    completion: Mapped[float] = mapped_column(Float, default=0.0)
    reason: Mapped[str] = mapped_column(String, default="")
    provenance: Mapped[str] = mapped_column(String, default="OBSERVED")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
