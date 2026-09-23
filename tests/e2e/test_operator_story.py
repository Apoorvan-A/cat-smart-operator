"""End-to-end operator story. Owner: Claude 4.

Mirrors the single narrative in docs/DEMO.md. Each step is skipped until the
owning subsystem lands its endpoints; unskip incrementally as integration
proceeds. Never delete a step to make the suite green — mark it skip/xfail with a
reason and a tracking note.
"""
from __future__ import annotations

import pytest

pytestmark = pytest.mark.requires_stack

STORY = "login -> today's task -> pre-start -> start -> proximity alert -> ack -> idle anomaly -> ETA change -> assistant -> handover"


@pytest.mark.skip(reason="pending backend auth endpoint (Claude 1)")
def test_operator_login():
    ...


@pytest.mark.skip(reason="pending tasks endpoint (Claude 1)")
def test_todays_task_assigned():
    ...


@pytest.mark.skip(reason="pending safety engine + WebSocket (Claude 1)")
def test_proximity_alert_and_acknowledge():
    ...


@pytest.mark.skip(reason="pending anomaly analytics (Claude 2)")
def test_excessive_idling_insight():
    ...


@pytest.mark.skip(reason="pending ETA service wiring (Claude 1 + Claude 2)")
def test_eta_changes_with_weather():
    ...


@pytest.mark.skip(reason="pending grounded assistant (Claude 1)")
def test_assistant_explains_delay():
    ...


@pytest.mark.skip(reason="pending shift handover generation (Claude 1)")
def test_shift_handover_generated():
    ...
