"""Operator router. Owner: Claude 1."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user
from app.core.database import get_db
from app.core.errors import not_found
from app.models.core import Operator
from app.schemas.auth import UserOut
from app.schemas.misc import TrainingRecordOut
from app.services import auth_service, training_service

router = APIRouter(prefix="/operators", tags=["operators"])


@router.get("/{operator_id}", response_model=UserOut)
def get_operator(operator_id: str, db: Session = Depends(get_db),
                 _: Operator = Depends(get_current_user)) -> UserOut:
    operator = db.get(Operator, operator_id)
    if operator is None:
        raise not_found("Operator")
    machine_id, shift_id = auth_service.current_assignment(db, operator_id)
    return UserOut(id=operator.id, name=operator.name, role=operator.role,
                   current_machine_id=machine_id, current_shift_id=shift_id)


@router.get("/{operator_id}/training", response_model=list[TrainingRecordOut])
def training(operator_id: str, db: Session = Depends(get_db),
             _: Operator = Depends(get_current_user)) -> list[TrainingRecordOut]:
    return training_service.recommendations(db, operator_id)
