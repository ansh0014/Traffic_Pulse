from pathlib import Path
from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):

    # Database
    database_url: str = Field(..., alias="DATABASE_URL")

    # ML Models
    model_dir: str = Field(..., alias="MODEL_DIR")

    # Server
    host: str = Field(..., alias="HOST")
    port: int = Field(..., alias="PORT")
    log_level: str = Field(..., alias="LOG_LEVEL")

    # CORS
    cors_origins: str = Field(..., alias="CORS_ORIGINS")

    # SMTP (optional — leave blank to disable)
    smtp_host: str = Field("", alias="SMTP_HOST")
    smtp_port: int = Field(587, alias="SMTP_PORT")
    smtp_user: str = Field("", alias="SMTP_USER")
    smtp_password: str = Field("", alias="SMTP_PASSWORD")
    alert_email_recipients: str = Field("", alias="ALERT_EMAIL_RECIPIENTS")

    # Alert thresholds
    high_impact_clearance_threshold_min: float = Field(..., alias="HIGH_IMPACT_CLEARANCE_THRESHOLD_MIN")
    closure_prob_alert_threshold: float = Field(..., alias="CLOSURE_PROB_ALERT_THRESHOLD")

    # Retraining (optional)
    retrain_schedule: str = Field("", alias="RETRAIN_SCHEDULE")

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def alert_recipient_list(self) -> list[str]:
        return [e.strip() for e in self.alert_email_recipients.split(",") if e.strip()]

    @property
    def model_path(self) -> Path:
        p = Path(self.model_dir)
        if not p.is_absolute() and not p.exists():
            # Try to resolve relative to project root (parent of backend/ directory)
            project_root = Path(__file__).resolve().parent.parent.parent
            alt_p = project_root / self.model_dir
            if alt_p.exists():
                return alt_p
        return p

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
    return Settings()
