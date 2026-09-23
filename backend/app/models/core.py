"""Core entities: operator, machine, assignment, shift. Owner: Claude 1."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Operator(Base):
    __tablename__ = "operator"

    id: Mapped[str] = mapped_column(String, primary_key=True)  # e.g. OP1001
    name: Mapped[str] = mapped_column(String)
    role: Mapped[str] = mapped_column(String, default="OPERATOR")  # RBAC role
    password_hash: Mapped[str] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)


class Machine(Base):
    __tablename__ = "machine"

    id: Mapped[str] = mapped_column(String, primary_key=True)  # e.g. EXC001
    type: Mapped[str] = mapped_column(String, default="EXCAVATOR")
    model: Mapped[str] = mapped_column(String, default="CAT 320")
    site_id: Mapped[str] = mapped_column(String, default="SITE-A")
    status: Mapped[str] = mapped_column(String, default="IDLE")  # IDLE|OPERATING|OFF|MAINTENANCE
    engine_hours: Mapped[float] = mapped_column(Float, default=0.0)


class OperatorMachineAssignment(Base):
    __tablename__ = "operator_machine_assignment"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    operator_id: Mapped[str] = mapped_column(ForeignKey("operator.id"))
    machine_id: Mapped[str] = mapped_column(ForeignKey("machine.id"))
    shift_id: Mapped[str | None] = mapped_column(ForeignKey("shift.id"), nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class Shift(Base):
    __tablename__ = "shift"

    id: Mapped[str] = mapped_column(String, primary_key=True)  # e.g. SH-2025-05-01-A
    operator_id: Mapped[str] = mapped_column(ForeignKey("operator.id"))
    machine_id: Mapped[str] = mapped_column(ForeignKey("machine.id"))
    start: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
