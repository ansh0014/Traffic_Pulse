"""
GridLock 2.0 — Application Configuration
==========================================
Loads settings from environment variables / .env file.
Uses pydantic-settings for validation and type coercion.
"""
from pathlib import Path
from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from .env file or environment variables."""

    # Database
    database_url: str = "sqlite+aiosqlite:///./gridlock.db"

    # ML Models
    model_dir: str = "Model"

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    log_level: str = "INFO"

    # CORS
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    # SMTP Email Alerts
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    alert_email_recipients: str = ""

    # Alert Thresholds
    high_impact_clearance_threshold_min: float = 360.0
    closure_prob_alert_threshold: float = 0.7

    # Retraining schedule (cron expression, empty to disable)
    retrain_schedule: str = ""

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def alert_recipient_list(self) -> list[str]:
        return [e.strip() for e in self.alert_email_recipients.split(",") if e.strip()]

    @property
    def model_path(self) -> Path:
        return Path(self.model_dir)

    @property
    def email_enabled(self) -> bool:
        return bool(self.smtp_host and self.smtp_user)

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


@lru_cache()
def get_settings() -> Settings:
    """Cached settings singleton."""
    return Settings()
