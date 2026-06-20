"""
Pydantic schemas for alerts.
"""
from datetime import datetime
from pydantic import BaseModel


class AlertOut(BaseModel):
    """Alert record returned from API."""
    id: int
    prediction_id: int
    alert_type: str          # high_impact, closure_risk, long_clearance
    severity: str            # critical, warning, info
    message: str
    is_read: bool
    email_sent: bool
    created_at: datetime | None = None

    # Denormalized incident info for display
    event_cause: str | None = None
    corridor: str | None = None
    impact_tier: str | None = None

    model_config = {"from_attributes": True}


class AlertListResponse(BaseModel):
    """Paginated alert list."""
    alerts: list[AlertOut]
    total: int
    unread_count: int


class AlertMarkRead(BaseModel):
    """Response after marking an alert as read."""
    id: int
    is_read: bool
