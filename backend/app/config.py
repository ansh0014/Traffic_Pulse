"""
Traffic Pulse — Application Configuration
All values are read from environment variables (via a .env file).
See .env.example for the full list of required and optional variables.
"""
from pathlib import Path
from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):

 
    database_url: str = Field(..., alias="DATABASE_URL")

    model_dir: str = Field(..., alias="MODEL_DIR")

    host: str = Field(..., alias="HOST")
    port: int = Field(..., alias="PORT")
    log_level: str = Field(..., alias="LOG_LEVEL")

    
    cors_origins: str = Field(..., alias="CORS_ORIGINS")

───────────────────
    smtp_host: str = Field("", alias="SMTP_HOST")
    smtp_port: int = Field(587, alias="SMTP_PORT")
    smtp_user: str = Field("", alias="SMTP_USER")
    smtp_password: str = Field("", alias="SMTP_PASSWORD")
    alert_email_recipients: str = Field("", alias="ALERT_EMAIL_RECIPIENTS")

 
    high_impact_clearance_threshold_min: float = Field(..., alias="HIGH_IMPACT_CLEARANCE_THRESHOLD_MIN")
    closure_prob_alert_threshold: float = Field(..., alias="CLOSURE_PROB_ALERT_THRESHOLD")

   
    retrain_schedule: str = Field("", alias="RETRAIN_SCHEDULE")

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

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
        "populate_by_name": True,
    }


@lru_cache()
def get_settings() -> Settings:
    """Cached settings singleton."""
    return Settings()
