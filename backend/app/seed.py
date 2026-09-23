"""Seed a minimal, deterministic demo dataset. Owner: Claude 1 / Claude 4.

Idempotent: safe to run repeatedly. Creates the entities the demo story needs
(docs/DEMO.md): an operator, a supervisor, one machine, an active assignment,
one task with an original ETA, a weather record, and a training module.

Run:  python -m app.seed
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_password
from app.models.core import Machine, Operator, OperatorMachineAssignment, Shift
from app.models.task import Task
from app.models.telemetry import WeatherRecord
from app.models.training import TrainingModule

DEMO_PASSWORD = "demo"  # prototype only


def seed(db: Session) -> None:
    now = datetime.now(timezone.utc)

    if db.get(Operator, "OP1001") is None:
        db.add(Operator(id="OP1001", name="Jane Doe", role="OPERATOR",
                        password_hash=hash_password(DEMO_PASSWORD)))
    if db.get(Operator, "SUP001") is None:
        db.add(Operator(id="SUP001", name="Sam Lead", role="SUPERVISOR",
                        password_hash=hash_password(DEMO_PASSWORD)))

    if db.get(Machine, "EXC001") is None:
        db.add(Machine(id="EXC001", type="EXCAVATOR", model="CAT 320",
                       site_id="SITE-A", status="OPERATING", engine_hours=1526.5))

    if db.get(Shift, "SH-DEMO-A") is None:
        db.add(Shift(id="SH-DEMO-A", operator_id="OP1001", machine_id="EXC001", start=now))

    has_assignment = db.query(OperatorMachineAssignment).filter_by(
        operator_id="OP1001", machine_id="EXC001", active=True).first()
    if has_assignment is None:
        db.add(OperatorMachineAssignment(operator_id="OP1001", machine_id="EXC001",
                                         shift_id="SH-DEMO-A", active=True))

    if db.get(Task, "T-101") is None:
        db.add(Task(id="T-101", title="Trench excavation - north lot", type="EXCAVATION",
                    priority="HIGH", site_id="SITE-A", machine_id="EXC001",
                    operator_id="OP1001", state="IN_PROGRESS", progress=0.62,
                    scheduled_start=now - timedelta(hours=2),
                    original_eta=now + timedelta(minutes=30)))

    db.add(WeatherRecord(site_id="SITE-A", timestamp=now, temperature=24.0,
                         rainfall=0.0, wind=8.0, visibility=10.0, humidity=55.0))

    if db.get(TrainingModule, "TR-EXC-SAFE") is None:
        db.add(TrainingModule(id="TR-EXC-SAFE", title="Safe Excavator Operation",
                              description="Proximity awareness and safe operation.",
                              machine_type="EXCAVATOR"))

    db.commit()


def main() -> None:
    Base.metadata.create_all(engine)
    db = SessionLocal()
    try:
        seed(db)
        print("Seeded demo data (operator OP1001 / password 'demo').")
    finally:
        db.close()


if __name__ == "__main__":
    main()
