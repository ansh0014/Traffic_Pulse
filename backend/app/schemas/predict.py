"""
Pydantic schemas for prediction requests and responses.
"""
from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field


class FeatureContribution(BaseModel):
    """A single SHAP feature contribution."""
    feature: str = Field(description="Human-readable feature name")
    value: str = Field(description="Feature value for this prediction")
    contribution: float = Field(description="SHAP contribution (signed)")
    direction: Literal["positive", "negative"] = Field(description="Impact direction")
    percentage: str = Field(description="Human-readable percentage, e.g. '+35%'")


class PredictRequest(BaseModel):
    """Request body for single event prediction."""
    event_type: Literal["planned", "unplanned"] = Field(
        default="unplanned",
        description="Whether the event is planned or unplanned"
    )
    event_cause: str = Field(
        description="Cause of the event, e.g. vehicle_breakdown, tree_fall, public_event"
    )
    corridor: str = Field(
        default="Non-corridor",
        description="Named corridor or 'Non-corridor'"
    )
    zone: str = Field(
        default="Unknown",
        description="Traffic zone, e.g. 'Central Zone 2'"
    )
    veh_type: str = Field(
        default="Unknown",
        description="Vehicle type involved"
    )
    police_station: str = Field(
        default="Unknown",
        description="Nearest police station"
    )
    latitude: float = Field(
        default=12.97, ge=-90.0, le=90.0,
        description="Latitude"
    )
    longitude: float = Field(
        default=77.59, ge=-180.0, le=180.0,
        description="Longitude"
    )
    start_datetime: datetime = Field(
        description="Event start date/time"
    )
    address: str | None = Field(
        default=None,
        description="Address of the event (optional)"
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "event_type": "unplanned",
                    "event_cause": "vehicle_breakdown",
                    "corridor": "Tumkur Road",
                    "zone": "North Zone 1",
                    "veh_type": "heavy_vehicle",
                    "police_station": "Peenya",
                    "latitude": 13.04,
                    "longitude": 77.52,
                    "start_datetime": "2024-04-10T09:15:00",
                    "address": "Tumkur Road, Peenya, Bengaluru"
                }
            ]
        }
    }


class BatchPredictRequest(BaseModel):
    """Request body for batch predictions (max 50)."""
    events: list[PredictRequest] = Field(
        max_length=50,
        description="List of events to predict (max 50)"
    )


class PredictionOutput(BaseModel):
    """Model prediction outputs (before resource recommendation)."""
    impact_tier: Literal["Low", "Medium", "High"]
    impact_confidence: dict[str, float]
    closure_probability: float
    expected_clearance_min: float


class ResourcePlan(BaseModel):
    """Resource deployment recommendation."""
    recommended_manpower: int
    recommended_barricades: int
    activate_diversion_plan: bool
    diversion_junction_points: int
    deployment_duration_min: int
    rationale: str


class PredictResponse(BaseModel):
    """Full prediction response including incident ID, predictions, and resources."""
    incident_id: int
    impact_tier: Literal["Low", "Medium", "High"]
    impact_confidence: dict[str, float]
    closure_probability: float
    expected_clearance_min: float
    recommended_manpower: int
    recommended_barricades: int
    activate_diversion_plan: bool
    diversion_junction_points: int
    deployment_duration_min: int
    rationale: str
    explanation: list[FeatureContribution] | None = None


class BatchPredictResponse(BaseModel):
    """Batch prediction response."""
    predictions: list[PredictResponse]
    total: int
