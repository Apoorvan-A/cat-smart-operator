"""AI assistant router. Owner: Claude 1."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user
from app.core.database import get_db
from app.models.core import Operator
from app.schemas.misc import AssistantQuery, AssistantResponse
from app.services import assistant_service

router = APIRouter(prefix="/assistant", tags=["assistant"])


@router.post("/query", response_model=AssistantResponse)
def query(payload: AssistantQuery, db: Session = Depends(get_db),
          _: Operator = Depends(get_current_user)) -> AssistantResponse:
    return assistant_service.query(db, payload.operator_id, payload.question)
