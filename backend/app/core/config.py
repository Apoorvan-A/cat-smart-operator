"""Application configuration (env-driven). Owner: Claude 1."""
from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "development"
    log_level: str = "INFO"
    cors_origins: str = "http://localhost:5173"

    database_url: str = "postgresql+psycopg://cat:cat_dev_password@localhost:5432/cat_operator"

    jwt_secret: str = "change-me-in-real-deployments"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    ml_service_url: str = "http://localhost:9000"

    # LLM explanation layer only — never given DB access. Empty => template fallback.
    llm_provider: str = ""
    llm_api_key: str = ""
    llm_model: str = ""

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
