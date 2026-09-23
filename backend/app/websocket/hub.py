"""WebSocket hub. Owner: Claude 1. See docs/API_CONTRACT.md (WebSocket).

Broadcasts SAFETY_ALERT / TELEMETRY_TICK / ETA_UPDATE / TELEMETRY_STALE and sends
one SNAPSHOT of active alerts on connect so a (re)connecting client is never blind.
"""
from __future__ import annotations

import asyncio
import logging

from fastapi import WebSocket

logger = logging.getLogger("cat.ws")


class ConnectionHub:
    def __init__(self) -> None:
        self._connections: set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        async with self._lock:
            self._connections.add(ws)
        logger.info("ws connected (total=%d)", len(self._connections))

    async def disconnect(self, ws: WebSocket) -> None:
        async with self._lock:
            self._connections.discard(ws)
        logger.info("ws disconnected (total=%d)", len(self._connections))

    async def broadcast(self, message: dict) -> None:
        """Send to all clients; drop any that error (client will reconnect)."""
        dead: list[WebSocket] = []
        for ws in list(self._connections):
            try:
                await ws.send_json(message)
            except Exception:  # noqa: BLE001
                dead.append(ws)
        for ws in dead:
            await self.disconnect(ws)

    def broadcast_sync(self, message: dict) -> None:
        """Fire-and-forget from sync code (services run in the request thread)."""
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                loop.create_task(self.broadcast(message))
            else:
                loop.run_until_complete(self.broadcast(message))
        except RuntimeError:
            # No event loop (e.g. under sync tests) — safe to skip the push.
            logger.debug("no event loop for ws broadcast; skipped")


hub = ConnectionHub()
