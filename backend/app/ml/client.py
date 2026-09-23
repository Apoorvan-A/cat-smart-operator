"""Client for the separate ML service, with deterministic fallbacks. Owner: Claude 1.

ADR-0002: ML availability/latency must never affect the backend. Every call has a
rule-based fallback; when used, results are marked provenance ASSUMED and
fallback_used=True.
"""
from __future__ import annotations

import logging

import httpx

from app.core.config import settings

logger = logging.getLogger("cat.ml")

_TIMEOUT = 2.0  # seconds; ML is best-effort


def predict_eta_minutes(
    task_id: str,
    task_type: str,
    progress: float,
    recent_cycle_time: float,
    rainfall: float = 0.0,
    visibility: float = 10.0,
) -> dict:
    """Return {minutes, provenance, factors, fallback_used}.

    Tries the ML service; on any failure falls back to a transparent
    historical-style estimate.
    """
    payload = {
        "task_id": task_id, "task_type": task_type, "progress": progress,
        "recent_cycle_time": recent_cycle_time, "rainfall": rainfall,
        "visibility": visibility,
    }
    try:
        resp = httpx.post(f"{settings.ml_service_url}/predict/eta", json=payload, timeout=_TIMEOUT)
        resp.raise_for_status()
        data = resp.json()
        return {
            "minutes": float(data["predicted_minutes_remaining"]),
            "provenance": data.get("provenance", "PREDICTED"),
            "factors": data.get("top_factors", []),
            "fallback_used": False,
        }
    except Exception as exc:  # noqa: BLE001 — any ML failure must degrade, not crash
        logger.warning("ML ETA unavailable (%s); using fallback", exc)
        return _fallback_eta(progress, recent_cycle_time, rainfall)


def _fallback_eta(progress: float, recent_cycle_time: float, rainfall: float) -> dict:
    remaining_cycles = max(0.0, 1.0 - progress) * 20.0
    minutes = remaining_cycles * recent_cycle_time / 60.0
    factors = []
    if rainfall > 2.0:
        minutes *= 1.12
        factors.append("rainfall increased cycle time")
    return {
        "minutes": round(minutes, 1),
        "provenance": "ASSUMED",
        "factors": factors,
        "fallback_used": True,
    }
