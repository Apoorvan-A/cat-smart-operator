"""Integration test fixtures. Owner: Claude 4.

Service tests target a live docker-compose stack over HTTP. When the stack is not
running they SKIP (never fail) so CI and local runs stay green until the
backend/ml sessions land their endpoints.
"""
from __future__ import annotations

import os
from pathlib import Path

import httpx
import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
SCENARIOS_DIR = REPO_ROOT / "demo" / "scenarios"

BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8000")
ML_URL = os.environ.get("ML_URL", "http://localhost:9000")


def _reachable(url: str) -> bool:
    try:
        httpx.get(f"{url}/health", timeout=1.0)
        return True
    except Exception:
        return False


@pytest.fixture(scope="session")
def backend_url() -> str:
    if not _reachable(BACKEND_URL):
        pytest.skip(f"backend not reachable at {BACKEND_URL} (start the compose stack)")
    return BACKEND_URL


@pytest.fixture(scope="session")
def ml_url() -> str:
    if not _reachable(ML_URL):
        pytest.skip(f"ml service not reachable at {ML_URL} (start the compose stack)")
    return ML_URL
