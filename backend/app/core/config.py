from __future__ import annotations

import os
from functools import lru_cache
from typing import List, Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # App
    app_env: str = "development"
    app_name: str = "UPI Sentinel"
    app_version: str = "1.0.0"
    app_secret_key: str = "dev-secret-key-change-in-production"
    debug: bool = False

    # JWT
    jwt_secret_key: str = "dev-jwt-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60
    jwt_refresh_token_expire_days: int = 7

    # Database
    # Default is SQLite for zero-configuration development.
    # Set DATABASE_URL in .env to switch to PostgreSQL for production.
    database_url: str = "sqlite+aiosqlite:///./upi_sentinel.db"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # CORS
    frontend_origin: str = "http://localhost:3000"

    # External APIs — loaded from env, NEVER from frontend
    sarvam_api_key: str = ""
    urlhaus_auth_key: str = ""
    virustotal_api_key: str = ""
    openai_api_key: str = ""

    # Rate Limiting
    rate_limit_per_minute: int = 60

    # Reports
    reports_dir: str = "./reports_output"

    @property
    def is_development(self) -> bool:
        return self.app_env == "development"

    @property
    def allowed_origins(self) -> List[str]:
        return [self.frontend_origin, "http://localhost:3000", "http://127.0.0.1:3000"]

    @property
    def sarvam_configured(self) -> bool:
        return bool(self.sarvam_api_key and self.sarvam_api_key.strip())

    @property
    def urlhaus_configured(self) -> bool:
        return bool(self.urlhaus_auth_key and self.urlhaus_auth_key.strip())

    @property
    def virustotal_configured(self) -> bool:
        return bool(self.virustotal_api_key and self.virustotal_api_key.strip())

    @property
    def openai_configured(self) -> bool:
        return bool(self.openai_api_key and self.openai_api_key.strip())


@lru_cache()
def get_settings() -> Settings:
    return Settings()
