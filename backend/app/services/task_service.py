"""Task + dynamic ETA service. Owner: Claude 1.

ETA uses the ML client (which has its own deterministic fallback). We never crash
on ML failure and never fake precision (ADR-0002).
"""
from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ml import client as ml
from app.models.task import Task, TaskEvent
from app.models.telemetry import Telemetry
from app.models.telemetry import WeatherRecord
from app.schemas.common import Explanation
from app.schemas.task import EtaResponse


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def today_tasks(db: Session, operator_id: str | None = None) -> list[Task]:
    stmt = select(Task)
    if operator_id:
        stmt = stmt.where(Task.operator_id == operator_id)
    tasks = list(db.execute(stmt).scalars().all())
    # "Today" = scheduled today or currently active; keep simple for the demo.
    today = date.today()
    return [t for t in tasks
            if t.state in ("SCHEDULED", "STARTED", "IN_PROGRESS", "AT_RISK", "DELAYED")
            or (t.scheduled_start and t.scheduled_start.date() == today)]


def get_task(db: Session, task_id: str) -> Task | None:
    return db.get(Task, task_id)


def _recent_cycle_time(db: Session, machine_id: str | None) -> float:
    if not machine_id:
        return 45.0
    row = db.execute(
        select(Telemetry.cycle_time).where(
            Telemetry.machine_id == machine_id, Telemetry.cycle_time.is_not(None)
        ).order_by(Telemetry.timestamp.desc())
    ).scalars().first()
    return float(row) if row else 45.0


def _current_weather(db: Session, site_id: str) -> WeatherRecord | None:
    return db.execute(
        select(WeatherRecord).where(WeatherRecord.site_id == site_id)
        .order_by(WeatherRecord.timestamp.desc())
    ).scalars().first()


def predict_eta(db: Session, task: Task) -> EtaResponse:
    weather = _current_weather(db, task.site_id)
    rainfall = weather.rainfall if weather and weather.rainfall is not None else 0.0
    visibility = weather.visibility if weather and weather.visibility is not None else 10.0

    result = ml.predict_eta_minutes(
        task_id=task.id, task_type=task.type, progress=task.progress,
        recent_cycle_time=_recent_cycle_time(db, task.machine_id),
        rainfall=rainfall, visibility=visibility,
    )

    predicted_eta = _utcnow() + timedelta(minutes=result["minutes"])
    delta_minutes = 0.0
    if task.original_eta:
        oe = task.original_eta
        if oe.tzinfo is None:
            oe = oe.replace(tzinfo=timezone.utc)
        delta_minutes = round((predicted_eta - oe).total_seconds() / 60.0, 1)

    why = ("; ".join(result["factors"]) if result["factors"]
           else "Based on current progress and recent cycle times.")
    action = ("No action needed; monitor conditions." if delta_minutes <= 5
              else "Task at risk of delay — review site conditions.")
    expl = Explanation(what=f"Predicted completion in {result['minutes']:.0f} min.",
                       why=why, action=action)

    # Persist the new prediction + a task event; flip to AT_RISK on meaningful slip.
    task.predicted_eta = predicted_eta
    if delta_minutes > 10 and task.state in ("STARTED", "IN_PROGRESS"):
        task.state = "AT_RISK"
        task.delay_reason = why
    db.add(TaskEvent(task_id=task.id, event_type="ETA_UPDATE",
                     payload={"predicted_eta": predicted_eta.isoformat(),
                              "fallback_used": result["fallback_used"]}))
    db.commit()

    return EtaResponse(
        task_id=task.id, predicted_eta=predicted_eta, delta_minutes=delta_minutes,
        provenance=result["provenance"], explanation=expl,
        fallback_used=result["fallback_used"],
    )


def set_state(db: Session, task: Task, state: str) -> Task:
    task.state = state
    db.add(TaskEvent(task_id=task.id, event_type=f"STATE_{state}", payload={}))
    db.commit()
    return task
