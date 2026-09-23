FROM python:3.11-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

COPY pyproject.toml ./
RUN pip install --upgrade pip && pip install -e ".[dev]" || pip install fastapi "uvicorn[standard]" sqlalchemy alembic "psycopg[binary]" pydantic pydantic-settings "python-jose[cryptography]" passlib[bcrypt] python-multipart httpx

COPY . .

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
