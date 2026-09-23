FROM python:3.11-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

COPY pyproject.toml ./
RUN pip install --upgrade pip && pip install -e ".[dev]" || pip install fastapi "uvicorn[standard]" scikit-learn pandas numpy joblib pydantic

COPY . .

EXPOSE 9000
CMD ["uvicorn", "src.service:app", "--host", "0.0.0.0", "--port", "9000"]
