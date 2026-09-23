"""Shared schema fragments. Owner: Claude 1."""
from __future__ import annotations

from pydantic import BaseModel

Provenance = str  # REAL | SIMULATED | ASSUMED | PREDICTED | OBSERVED


class Explanation(BaseModel):
    """The WHAT / WHY / ACTION triad every intelligent feature returns."""
    what: str
    why: str
    action: str
