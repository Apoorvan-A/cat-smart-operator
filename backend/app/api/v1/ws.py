"""WebSocket router. Owner: Claude 1. See docs/API_CONTRACT.md (WebSocket)."""
from __future__ import annotations

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.security import decode_access_token
from app.models.safety import Alert
from app.websocket.hub import hub

router = APIRouter(tags=["websocket"])


def _active_alert_snapshot() -> dict:
    db = SessionLocal()
    try:
        alerts = db.execute(
            select(Alert).where(Alert.status.in_(("CREATED", "ACTIVE", "ESCALATED")))
            .order_by(Alert.created_at.desc())
        ).scalars().all()
        payload = [{"id": a.id, "severity": a.severity, "status": a.status,
                    "count": a.count, "summary": a.summary, "machine_id": a.machine_id,
                    "type": a.type} for a in alerts]
    finally:
        db.close()
    return {"type": "SNAPSHOT", "payload": {"active_alerts": payload}}


@router.websocket("/ws")
async def websocket_endpoint(ws: WebSocket) -> None:
    # Token is passed as a query param (browsers can't set WS headers easily).
    token = ws.query_params.get("token")
    if not token or decode_access_token(token) is None:
        await ws.close(code=4401)  # unauthorized
        return

    await hub.connect(ws)
    try:
        await ws.send_json(_active_alert_snapshot())
        while True:
            # We don't expect client messages; keep the connection open.
            await ws.receive_text()
    except WebSocketDisconnect:
        await hub.disconnect(ws)
    except Exception:  # noqa: BLE001
        await hub.disconnect(ws)
