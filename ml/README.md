# ML + Data

**Owner: Claude 2 (ML + Data Engineer).** See `../docs/ML.md`.

## Layout
```
src/
  generate.py   # correlated synthetic data -> /data (labeled SIMULATED)
  train.py      # train + evaluate + persist models to ML_MODEL_DIR
  service.py    # FastAPI model service (backend calls this over HTTP)
models/          # persisted .joblib artifacts (gitignored)
notebooks/       # exploration
tests/           # synthetic-data validation, leakage checks, evaluation
```

## Rules
- Synthetic data must be **correlated**, never independent random numbers.
- Simplest model that works; no deep learning without justification in `ML.md`.
- Never fabricate accuracy — metrics come from the held-out test set.
- Every model has a deterministic fallback the backend can use if this service
  is down (ADR-0002). Don't change backend API contracts silently.

## Run
```bash
pip install -e ".[dev]"
python -m src.generate
python -m src.train
uvicorn src.service:app --reload --port 9000   # http://localhost:9000/health
```
