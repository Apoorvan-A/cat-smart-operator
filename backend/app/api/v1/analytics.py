"""Analytics router. Owner: Claude 1."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user
from app.core.database import get_db
from app.models.core import Operator
from app.schemas.misc import FuelOut, ProductivityOut
from app.services import analytics_service

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/fuel", response_model=FuelOut)
def fuel(machine_id: str, db: Session = Depends(get_db),
         _: Operator = Depends(get_current_user)) -> FuelOut:
    return analytics_service.fuel(db, machine_id)


@router.get("/productivity", response_model=ProductivityOut)
def productivity(machine_id: str, db: Session = Depends(get_db),
                 _: Operator = Depends(get_current_user)) -> ProductivityOut:
    return analytics_service.productivity(db, machine_id)
