"""
Traffic Pulse — SQLAlchemy ORM Models
Database models for incidents, predictions, alerts, and model versions.
"""
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from backend.app.database import Base


class Incident(Base):
    """A traffic event (incoming or historical)."""
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_type = Column(String(20), nullable=False)       # planned / unplanned
    event_cause = Column(String(50), nullable=False)
    corridor = Column(String(100), default="Non-corridor")
    zone = Column(String(50), default="Unknown")
    veh_type = Column(String(50), default="Unknown")
    police_station = Column(String(100), default="Unknown")
    latitude = Column(Float, default=12.97)
    longitude = Column(Float, default=77.59)
    start_datetime = Column(DateTime, nullable=False)
    status = Column(String(20), default="active")         # active / closed / resolved
    address = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    predictions = relationship("Prediction", back_populates="incident", cascade="all, delete-orphan")


class Prediction(Base):
    """ML model prediction + resource recommendation for an incident."""
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=False)

    # Impact severity
    impact_tier = Column(String(10), nullable=False)      # Low / Medium / High
    impact_low_prob = Column(Float, default=0.0)
    impact_medium_prob = Column(Float, default=0.0)
    impact_high_prob = Column(Float, default=0.0)

    # Closure
    closure_probability = Column(Float, default=0.0)

    # Clearance time
    expected_clearance_min = Column(Float, default=0.0)

    # Resource recommendations
    recommended_manpower = Column(Integer, default=0)
    recommended_barricades = Column(Integer, default=0)
    activate_diversion = Column(Boolean, default=False)
    diversion_points = Column(Integer, default=0)
    deployment_duration_min = Column(Integer, default=60)
    rationale = Column(Text, nullable=True)

    # SHAP explanations (JSON blob)
    shap_explanation_json = Column(JSON, nullable=True)

    predicted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    incident = relationship("Incident", back_populates="predictions")
    alerts = relationship("Alert", back_populates="prediction", cascade="all, delete-orphan")


class Alert(Base):
    """Alerts generated when predictions cross thresholds."""
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    prediction_id = Column(Integer, ForeignKey("predictions.id"), nullable=False)
    alert_type = Column(String(30), nullable=False)       # high_impact, closure_risk, long_clearance
    severity = Column(String(15), nullable=False)          # critical, warning, info
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    email_sent = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    prediction = relationship("Prediction", back_populates="alerts")


class ModelVersion(Base):
    """Tracks trained model versions for rollback and comparison."""
    __tablename__ = "model_versions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    model_name = Column(String(50), nullable=False)       # impact_severity, closure, duration
    version = Column(String(20), nullable=False)
    file_path = Column(String(200), nullable=False)
    primary_metric = Column(Float, nullable=True)
    metric_name = Column(String(30), nullable=True)       # recall_high, roc_auc, mae
    is_active = Column(Boolean, default=False)
    trained_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
