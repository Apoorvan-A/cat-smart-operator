"""Auth dependencies: current user + RBAC. Owner: Claude 1. See docs/SECURITY.md."""
from __future__ import annotations

from collections.abc import Callable

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.errors import forbidden, unauthorized
from app.core.security import decode_access_token
from app.models.core import Operator

_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> Operator:
    if creds is None or not creds.credentials:
        raise unauthorized()
    claims = decode_access_token(creds.credentials)
    if claims is None or "sub" not in claims:
        raise unauthorized("Invalid or expired token")
    user = db.get(Operator, claims["sub"])
    if user is None:
        raise unauthorized("Unknown user")
    return user


def require_role(*roles: str) -> Callable[[Operator], Operator]:
    """Dependency factory enforcing that the caller has one of ``roles``."""
    allowed = set(roles)

    def _dep(user: Operator = Depends(get_current_user)) -> Operator:
        if user.role not in allowed and user.role != "ADMIN":
            raise forbidden(f"Requires role in {sorted(allowed)}")
        return user

    return _dep
