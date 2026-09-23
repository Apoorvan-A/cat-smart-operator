"""Task router. Owner: Claude 1."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user
from app.core.database import get_db
from app.core.errors import not_found
from app.models.core import Operator
from app.schemas.task import EtaResponse, TaskOut
from app.services import task_service

router = APIRouter(prefix="/tasks", tags=["tasks"])


def _task_out(t) -> TaskOut:
    out = TaskOut.model_validate(t)
    out.eta_provenance = "PREDICTED" if t.predicted_eta else "ASSUMED"
    return out


@router.get("/today", response_model=list[TaskOut])
def today(db: Session = Depends(get_db),
          user: Operator = Depends(get_current_user)) -> list[TaskOut]:
    return [_task_out(t) for t in task_service.today_tasks(db, user.id)]


@router.get("/{task_id}", response_model=TaskOut)
def get_task(task_id: str, db: Session = Depends(get_db),
             _: Operator = Depends(get_current_user)) -> TaskOut:
    task = task_service.get_task(db, task_id)
    if task is None:
        raise not_found("Task")
    return _task_out(task)


@router.post("/{task_id}/predict-eta", response_model=EtaResponse)
def predict_eta(task_id: str, db: Session = Depends(get_db),
                _: Operator = Depends(get_current_user)) -> EtaResponse:
    task = task_service.get_task(db, task_id)
    if task is None:
        raise not_found("Task")
    return task_service.predict_eta(db, task)


@router.post("/{task_id}/start", response_model=TaskOut)
def start(task_id: str, db: Session = Depends(get_db),
          _: Operator = Depends(get_current_user)) -> TaskOut:
    task = task_service.get_task(db, task_id)
    if task is None:
        raise not_found("Task")
    return _task_out(task_service.set_state(db, task, "IN_PROGRESS"))


@router.post("/{task_id}/complete", response_model=TaskOut)
def complete(task_id: str, db: Session = Depends(get_db),
             _: Operator = Depends(get_current_user)) -> TaskOut:
    task = task_service.get_task(db, task_id)
    if task is None:
        raise not_found("Task")
    return _task_out(task_service.set_state(db, task, "COMPLETED"))
