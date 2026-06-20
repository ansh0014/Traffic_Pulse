"""
Pydantic schemas for incidents.
"""
from datetime import datetime
from pydantic import BaseModel, Field


class IncidentOut(BaseModel):
    """Incident record returned from API."""
    id: int
    event_type: str
    event_cause: str
    corridor: str
    zone: str
    veh_type: str
    police_station: str
    latitude: float
    longitude: float
    start_datetime: datetime
    status: str
    address: str | None = None
    created_at: datetime | None = None

    # Associated prediction (if any)
    impact_tier: str | None = None
    closure_probability: float | None = None
    expected_clearance_min: float | None = None
    recommended_manpower: int | None = None

    model_config = {"from_attributes": True}


class IncidentListResponse(BaseModel):
    """Paginated list of incidents."""
    incidents: list[IncidentOut]
    total: int
    page: int
    page_size: int


class StatsOverview(BaseModel):
    """Dashboard summary statistics."""
    total_incidents: int = 0
    active_incidents: int = 0
    high_impact_count: int = 0
    medium_impact_count: int = 0
    low_impact_count: int = 0
    avg_clearance_min: float = 0.0
    avg_closure_probability: float = 0.0
    incidents_by_zone: dict[str, int] = Field(default_factory=dict)
    incidents_by_cause: dict[str, int] = Field(default_factory=dict)
    incidents_by_hour: dict[int, int] = Field(default_factory=dict)
    recent_incidents: list[IncidentOut] = Field(default_factory=list)
