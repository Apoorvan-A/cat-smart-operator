"""Telemetry ingestion + freshness. Owner: Claude 1.

Pipeline entry point: validate -> dedup -> store -> feed the safety engine.
One bad reading never breaks the batch.
"""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.telemetry import Telemetry
from app.safety import rules
from app.schemas.telemetry import IngestRequest, IngestResponse, TelemetryReading
from app.services import safety_service
from app.telemetry.validation import validate_reading

STALE_AFTER_SECONDS = 60.0


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _as_utc(dt: datetime) -> datetime:
    return dt if dt.tzinfo is not None else dt.replace(tzinfo=timezone.utc)


def _to_sample(reading: TelemetryReading, prev: Telemetry | None) -> rules.TelemetrySample:
    prev_speed = prev.speed if prev else None
    dt = None
    if prev and prev.timestamp:
        # SQLite returns naive datetimes; normalize both sides before subtracting.
        dt = (_as_utc(reading.timestamp) - _as_utc(prev.timestamp)).total_seconds()
    return rules.TelemetrySample(
        machine_id=reading.machine_id,
        operator_id=reading.operator_id,
        seatbelt_status=reading.seatbelt_status or "FASTENED",
        machine_state=reading.machine_state or "IDLE",
        speed=reading.speed or 0.0,
        slope_deg=0.0,
        prev_speed=prev_speed,
        dt_seconds=dt,
    )


def ingest(db: Session, request: IngestRequest) -> IngestResponse:
    accepted = duplicates = quarantined = 0

    for reading in request.readings:
        # Idempotency: same key => duplicate, skip.
        exists = db.execute(
            select(Telemetry.id).where(Telemetry.idempotency_key == reading.idempotency_key)
        ).first()
        if exists:
            duplicates += 1
            continue

        ok, _reason = validate_reading(reading)
        prev = db.execute(
            select(Telemetry).where(Telemetry.machine_id == reading.machine_id)
            .order_by(Telemetry.timestamp.desc())
        ).scalars().first()

        row = Telemetry(
            idempotency_key=reading.idempotency_key,
            timestamp=reading.timestamp,
            machine_id=reading.machine_id,
            operator_id=reading.operator_id,
            engine_hours=reading.engine_hours,
            fuel_used=reading.fuel_used,
            fuel_rate=reading.fuel_rate,
            load_cycles=reading.load_cycles,
            idle_time=reading.idle_time,
            cycle_time=reading.cycle_time,
            engine_temperature=reading.engine_temperature,
            hydraulic_pressure=reading.hydraulic_pressure,
            engine_load=reading.engine_load,
            speed=reading.speed,
            latitude=reading.latitude,
            longitude=reading.longitude,
            seatbelt_status=reading.seatbelt_status,
            warning_code=reading.warning_code,
            machine_state=reading.machine_state,
            quarantined=not ok,
            provenance="SIMULATED",
        )
        db.add(row)
        db.flush()

        if not ok:
            quarantined += 1
            continue

        accepted += 1
        # Only validated readings reach the safety engine.
        sample = _to_sample(reading, prev)
        safety_service.process_sample(
            db, sample,
            context={"telemetry_id": row.id, "timestamp": reading.timestamp.isoformat()},
            lat=reading.latitude, lng=reading.longitude,
        )

    db.commit()
    return IngestResponse(accepted=accepted, duplicates=duplicates, quarantined=quarantined)


def freshness(db: Session, machine_id: str) -> tuple[bool, float | None]:
    """Return (stale, age_seconds) for a machine's latest telemetry."""
    latest = db.execute(
        select(Telemetry).where(Telemetry.machine_id == machine_id)
        .order_by(Telemetry.timestamp.desc())
    ).scalars().first()
    if latest is None or latest.timestamp is None:
        return True, None
    ts = latest.timestamp
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)
    age = (_utcnow() - ts).total_seconds()
    return age > STALE_AFTER_SECONDS, age
