# ML Strategy

Owner: Claude 2. Rule: use the simplest model that solves the problem. No deep
learning without written justification here. Every model documents objective,
features, target, algorithm, evaluation, limitations, fallback, explainability.

## Guardrails

- Models run in a **separate ML service** behind HTTP; the backend always has a
  deterministic fallback if the service is slow/down.
- No model makes safety-critical decisions.
- We never fabricate accuracy numbers — metrics come from the held-out test set
  on synthetic data and are labeled as such.
- Guard against leakage: no future information, no target-derived features, split
  by time and by machine/operator where relevant.

## Model 1 — Task ETA prediction

- **Objective:** predict remaining time to task completion.
- **Why ML:** completion time depends on non-linear interaction of load, cycle
  time, weather, machine, operator baseline — hard to hand-tune.
- **Features:** task type, progress, recent avg cycle time, load cycles, engine
  load, rainfall, visibility, wind, machine baseline, operator baseline.
- **Target:** minutes to completion.
- **Algorithm:** Gradient Boosting Regressor (fallback candidate: Random Forest).
- **Evaluation:** MAE / RMSE in minutes; baseline = historical average per task type.
- **Fallback:** historical average cycle time × remaining cycles (`ASSUMED`).
- **Explainability:** report top contributing features as the "why" string, e.g.
  "rainfall increased average cycle time".

## Model 2 — Anomaly / unusual-operation detection

- **Objective:** flag excessive idling, abnormal fuel/cycle, unusual patterns.
- **Why ML/stats:** thresholds alone miss context; per-entity baselines drift.
- **Approach (layered):**
  1. deterministic rules (hard limits, e.g. idle > 45 min while assigned),
  2. rolling z-score vs machine/operator baseline,
  3. Isolation Forest on the multivariate feature vector for pattern anomalies.
- **Output:** anomaly flag + score + which signal drove it.
- **Evaluation:** precision/recall against injected synthetic anomalies.
- **Fallback:** rules + z-score only if the model is unavailable.
- **Explainability:** "idle time 42 min vs your 21 min recent average".

## Model 3 — Machine health

- **Objective:** health score + trend + `NORMAL/WARNING/DEGRADED/CRITICAL`.
- **Approach:** anomaly score over temperature / hydraulic pressure /
  productivity trend; classification only if justified by the synthetic signal.
- **Language:** responsible terms — "anomaly detected", "maintenance attention
  recommended", "health trend deteriorating". Never "component X will fail on date Y".
- **Fallback:** threshold state machine on the raw signals.

## Fuel & productivity analytics

Deterministic computed metrics (not models): fuel/hour, fuel/cycle, idle fuel
estimate, cycles/hour, idle %, vs machine/operator/task baselines. Labeled
`OBSERVED`. Every insight is WHAT/WHY/ACTION and avoids arbitrary claims.

## What we deliberately do NOT do

- No exact component-failure prediction (synthetic data doesn't support it).
- No medical/fatigue/mental-health inference — only operational language
  ("high alert frequency", "extended idle pattern", "differs from baseline").
- No deep learning.
