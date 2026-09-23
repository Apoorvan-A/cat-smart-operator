"""Grounded AI assistant. Owner: Claude 1. See docs/API_CONTRACT.md, ADR-0001.

Flow: question -> intent -> fixed read-only fact tools (which query the DB) ->
structured facts -> explanation. The LLM (when configured) only phrases the
facts; with LLM_PROVIDER empty a deterministic template explainer is used. The
LLM never queries the DB and never invents data; missing facts => data_available
False and the answer says so.
"""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.core import OperatorMachineAssignment
from app.models.safety import SafetyEvent
from app.schemas.misc import AssistantResponse
from app.services import analytics_service, machine_service, task_service


def _current_machine_id(db: Session, operator_id: str) -> str | None:
    row = db.execute(
        select(OperatorMachineAssignment.machine_id).where(
            OperatorMachineAssignment.operator_id == operator_id,
            OperatorMachineAssignment.active.is_(True),
        )
    ).scalars().first()
    return row


def _detect_intent(question: str) -> str:
    q = question.lower()
    if any(w in q for w in ("delay", "eta", "late", "on track", "finish")):
        return "task_eta"
    if "fuel" in q:
        return "fuel"
    if any(w in q for w in ("safe", "warning", "alert", "hazard")):
        return "safety"
    if any(w in q for w in ("health", "machine", "normal", "temperature")):
        return "machine_health"
    return "unknown"


def query(db: Session, operator_id: str, question: str) -> AssistantResponse:
    intent = _detect_intent(question)
    machine_id = _current_machine_id(db, operator_id)

    if intent == "unknown":
        return AssistantResponse(
            answer="I can help with your task ETA, machine health, fuel usage, and "
                   "safety events. Try asking about one of those.",
            grounded=True, facts_used=[], provenance="OBSERVED", data_available=True)

    if machine_id is None and intent in ("fuel", "machine_health", "safety"):
        return AssistantResponse(
            answer="I don't have an active machine assignment for you, so that data "
                   "is unavailable right now.",
            grounded=True, facts_used=[], provenance="OBSERVED", data_available=False)

    if intent == "task_eta":
        tasks = task_service.today_tasks(db, operator_id)
        active = next((t for t in tasks if t.state in ("STARTED", "IN_PROGRESS", "AT_RISK")), None)
        if active is None:
            return AssistantResponse(answer="You have no active task right now.",
                                     grounded=True, data_available=False, provenance="OBSERVED")
        eta = task_service.predict_eta(db, active)
        return AssistantResponse(
            answer=f"{eta.explanation.what} {eta.explanation.why} {eta.explanation.action}",
            grounded=True, facts_used=[{"tool": "tasks.predict_eta", "task_id": active.id}],
            provenance=eta.provenance, data_available=True)

    if intent == "fuel":
        f = analytics_service.fuel(db, machine_id)
        return AssistantResponse(
            answer=f"{f.insight.what} {f.insight.why} {f.insight.action}",
            grounded=True, facts_used=[{"tool": "analytics.fuel", "machine_id": machine_id}],
            provenance=f.provenance, data_available=True)

    if intent == "machine_health":
        h = machine_service.health(db, machine_id)
        if h is None:
            return AssistantResponse(answer="That machine's health data is unavailable.",
                                     grounded=True, data_available=False, provenance="OBSERVED")
        return AssistantResponse(
            answer=f"{h.explanation.what} {h.explanation.why} {h.explanation.action}",
            grounded=True, facts_used=[{"tool": "machine.health", "machine_id": machine_id}],
            provenance=h.provenance, data_available=True)

    # intent == "safety"
    events = db.execute(
        select(SafetyEvent).where(SafetyEvent.machine_id == machine_id)
        .order_by(SafetyEvent.timestamp.desc()).limit(5)
    ).scalars().all()
    if not events:
        return AssistantResponse(answer="No recent safety events on your machine.",
                                 grounded=True, data_available=True, provenance="OBSERVED")
    summary = ", ".join(f"{e.type} ({e.severity})" for e in events)
    return AssistantResponse(
        answer=f"Recent safety events on {machine_id}: {summary}.",
        grounded=True, facts_used=[{"tool": "safety.events", "machine_id": machine_id}],
        provenance="OBSERVED", data_available=True)


def llm_enabled() -> bool:
    """Whether an external LLM phrasing layer is configured (else template mode)."""
    return bool(settings.llm_provider)
