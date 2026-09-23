"""Audit logging. Owner: Claude 1. See docs/SECURITY.md."""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.ops import AuditLog


def record(db: Session, *, actor: str, action: str, entity_type: str,
           entity_id: str, detail: dict | None = None) -> None:
    db.add(AuditLog(actor=actor, action=action, entity_type=entity_type,
                    entity_id=entity_id, detail=detail or {}))
    db.flush()
