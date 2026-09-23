"""Backend test fixtures. Owner: Claude 1.

Sets a throwaway SQLite DB via env BEFORE any app import, so the app engine binds
to SQLite (no Postgres needed). Provides a TestClient and an auth-token helper.
"""
from __future__ import annotations

import os
import tempfile

# Must be set before importing app.core.config / app.main.
_db_fd, _db_path = tempfile.mkstemp(suffix=".db")
os.close(_db_fd)
os.environ["DATABASE_URL"] = f"sqlite:///{_db_path}"
os.environ["JWT_SECRET"] = "test-secret"
os.environ["APP_ENV"] = "test"

import pytest  # noqa: E402
from starlette.testclient import TestClient  # noqa: E402


@pytest.fixture()
def client():
    from app.core.database import Base, SessionLocal, engine
    from app.main import app
    from app.seed import seed

    Base.metadata.create_all(engine)
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()

    with TestClient(app) as c:
        yield c


@pytest.fixture()
def token(client) -> str:
    resp = client.post("/api/v1/auth/login", json={"username": "OP1001", "password": "demo"})
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


@pytest.fixture()
def auth(token) -> dict:
    return {"Authorization": f"Bearer {token}"}
