"""Auth router. Owner: Claude 1."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user
from app.core.database import get_db
from app.core.errors import unauthorized
from app.core.security import create_access_token
from app.models.core import Operator
from app.schemas.auth import LoginRequest, TokenResponse, UserOut
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


def _user_out(db: Session, operator: Operator) -> UserOut:
    machine_id, shift_id = auth_service.current_assignment(db, operator.id)
    return UserOut(id=operator.id, name=operator.name, role=operator.role,
                   current_machine_id=machine_id, current_shift_id=shift_id)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    operator = auth_service.authenticate(db, payload.username, payload.password)
    if operator is None:
        raise unauthorized("Invalid username or password")
    token = create_access_token(operator.id, operator.role)
    return TokenResponse(access_token=token, user=_user_out(db, operator))


@router.get("/me", response_model=UserOut)
def me(user: Operator = Depends(get_current_user), db: Session = Depends(get_db)) -> UserOut:
    return _user_out(db, user)
