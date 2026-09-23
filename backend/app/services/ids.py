"""Human-readable id generation. Owner: Claude 1."""
from __future__ import annotations

from uuid import uuid4


def new_id(prefix: str) -> str:
    return f"{prefix}-{uuid4().hex[:8]}"
