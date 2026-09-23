"""Telemetry + weather. Owner: Claude 1."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Telemetry(Base):
    __tablename__ = "telemetry"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    idempotency_key: Mapped[str] = mapped_column(String, unique=True, index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    machine_id: Mapped[str] = mapped_column(String, index=True)
    operator_id: Mapped[str] = mapped_column(String, index=True)

    engine_hours: Mapped[float | None] = mapped_column(Float, nullable=True)
    fuel_used: Mapped[float | None] = mapped_column(Float, nullable=True)
    fuel_rate: Mapped[float | None] = mapped_column(Float, nullable=True)
    load_cycles: Mapped[int | None] = mapped_column(Integer, nullable=True)
    idle_time: Mapped[float | None] = mapped_column(Float, nullable=True)
    cycle_time: Mapped[float | None] = mapped_column(Float, nullable=True)
    engine_temperature: Mapped[float | None] = mapped_column(Float, nullable=True)
    hydraulic_pressure: Mapped[float | None] = mapped_column(Float, nullable=True)
    engine_load: Mapped[float | None] = mapped_column(Float, nullable=True)
    speed: Mapped[float | None] = mapped_column(Float, nullable=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)

    seatbelt_status: Mapped[str | None] = mapped_column(String, nullable=True)
    warning_code: Mapped[str | None] = mapped_column(String, nullable=True)
    machine_state: Mapped[str | None] = mapped_column(String, nullable=True)

    quarantined: Mapped[bool] = mapped_column(Boolean, default=False)
    provenance: Mapped[str] = mapped_column(String, default="SIMULATED")


class WeatherRecord(Base):
    __tablename__ = "weather_record"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    site_id: Mapped[str] = mapped_column(String, index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    temperature: Mapped[float | None] = mapped_column(Float, nullable=True)
    rainfall: Mapped[float | None] = mapped_column(Float, nullable=True)
    wind: Mapped[float | None] = mapped_column(Float, nullable=True)
    visibility: Mapped[float | None] = mapped_column(Float, nullable=True)
    humidity: Mapped[float | None] = mapped_column(Float, nullable=True)
    provenance: Mapped[str] = mapped_column(String, default="SIMULATED")
