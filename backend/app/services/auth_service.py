"""Auth service. Owner: Claude 1."""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import verify_password
from app.models.core import Operator, OperatorMachineAssignment


def authenticate(db: Session, username: str, password: str) -> Operator | None:
    operator = db.get(Operator, username)
    if operator is None:
        return None
    if not verify_password(password, operator.password_hash):
        return None
    return operator


def current_assignment(db: Session, operator_id: str) -> tuple[str | None, str | None]:
    """Return (machine_id, shift_id) for the operator's active assignment."""
    row = db.execute(
        select(OperatorMachineAssignment).where(
            OperatorMachineAssignment.operator_id == operator_id,
            OperatorMachineAssignment.active.is_(True),
        )
    ).scalars().first()
    if row is None:
        return None, None
    return row.machine_id, row.shift_id
