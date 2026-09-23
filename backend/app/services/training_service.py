"""Training recommendations from observed safety events. Owner: Claude 1.

Personalizes recommendations, e.g. repeated proximity alerts -> "Safe Excavator
Operation", with the reason attached (explainability).
"""
from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.safety import SafetyEvent
from app.models.training import TrainingModule, TrainingRecord
from app.schemas.misc import TrainingRecordOut

# event type -> (module id, threshold, module title fallback)
_RULES = {
    "PROXIMITY_HAZARD": ("TR-EXC-SAFE", 3, "Safe Excavator Operation"),
    "SEATBELT_UNFASTENED": ("TR-SEATBELT", 2, "Seatbelt & Cabin Safety"),
    "OVERSPEED": ("TR-SPEED", 3, "Site Speed Management"),
}


def recommendations(db: Session, operator_id: str) -> list[TrainingRecordOut]:
    out: list[TrainingRecordOut] = []

    # Existing records first.
    for rec in db.execute(
        select(TrainingRecord).where(TrainingRecord.operator_id == operator_id)
    ).scalars().all():
        module = db.get(TrainingModule, rec.module_id)
        out.append(TrainingRecordOut(
            module_id=rec.module_id,
            title=module.title if module else rec.module_id,
            status=rec.status, reason=rec.reason,
            provenance=rec.provenance, completion=rec.completion,
        ))
    seen = {r.module_id for r in out}

    # Derived recommendations from safety-event counts.
    counts = dict(db.execute(
        select(SafetyEvent.type, func.count()).where(SafetyEvent.operator_id == operator_id)
        .group_by(SafetyEvent.type)
    ).all())

    for ev_type, (module_id, threshold, title) in _RULES.items():
        if counts.get(ev_type, 0) >= threshold and module_id not in seen:
            module = db.get(TrainingModule, module_id)
            out.append(TrainingRecordOut(
                module_id=module_id,
                title=module.title if module else title,
                status="RECOMMENDED",
                reason=f"{counts[ev_type]} {ev_type} events in recent shifts",
                provenance="OBSERVED", completion=0.0,
            ))
    return out
