"""ML model service (separate process). Owner: Claude 2.

The backend calls this over HTTP (ML_SERVICE_URL) and always has a deterministic
fallback if it is slow or down (ADR-0002). Models never make safety decisions.
See ../docs/ML.md and ../docs/API_CONTRACT.md.

This is the integration-ready shell: endpoints return typed shapes with clearly
labeled provenance. Real models load from ML_MODEL_DIR once trained.
"""
from __future__ import annotations

from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="CAT Operator ML Service", version="0.1.0")


class EtaRequest(BaseModel):
    task_id: str
    task_type: str
    progress: float
    recent_cycle_time: float
    rainfall: float = 0.0
    visibility: float = 10.0


class EtaResponse(BaseModel):
    task_id: str
    predicted_minutes_remaining: float
    provenance: str = "PREDICTED"
    top_factors: list[str] = []


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/predict/eta", response_model=EtaResponse)
def predict_eta(req: EtaRequest) -> EtaResponse:
    """Placeholder until the trained model lands. Returns a transparent estimate
    so backend integration can proceed; real model replaces the body only."""
    remaining_cycles = max(0.0, (1.0 - req.progress)) * 20.0
    minutes = remaining_cycles * req.recent_cycle_time / 60.0
    factors = []
    if req.rainfall > 2.0:
        minutes *= 1.12
        factors.append("rainfall increased cycle time")
    return EtaResponse(
        task_id=req.task_id,
        predicted_minutes_remaining=round(minutes, 1),
        top_factors=factors,
    )
