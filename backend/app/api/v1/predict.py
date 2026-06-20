"""
Prediction endpoints — POST /predict, POST /batch_predict
"""
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database import get_db
from backend.app.models import Incident, Prediction
from backend.app.schemas.predict import (
    PredictRequest, PredictResponse, FeatureContribution,
    BatchPredictRequest, BatchPredictResponse,
)
from backend.app.services.prediction import get_prediction_service
from backend.app.services.recommendation import get_recommendation_service
from backend.app.services.alert_service import get_alert_service

logger = logging.getLogger("gridlock.api.predict")
router = APIRouter(tags=["Predictions"])


async def _process_single_prediction(
    event_req: PredictRequest,
    db: AsyncSession,
    explain: bool = False,
) -> PredictResponse:
    """Core logic for a single prediction — used by both single and batch endpoints."""
    pred_svc = get_prediction_service()
    rec_svc = get_recommendation_service()
    alert_svc = get_alert_service()

    # 1. Create incident record
    incident = Incident(
        event_type=event_req.event_type,
        event_cause=event_req.event_cause.lower(),
        corridor=event_req.corridor,
        zone=event_req.zone,
        veh_type=event_req.veh_type,
        police_station=event_req.police_station,
        latitude=event_req.latitude,
        longitude=event_req.longitude,
        start_datetime=event_req.start_datetime,
        status="active",
        address=event_req.address,
    )
    db.add(incident)
    await db.flush()  # get incident.id

    # 2. Run ML predictions
    event_dict = event_req.model_dump()
    event_dict["start_datetime"] = str(event_req.start_datetime)
    prediction_result = pred_svc.predict(event_dict)

    # 3. Generate resource recommendation
    resource_plan = rec_svc.recommend(prediction_result, event_dict)

    # 4. SHAP explanation (opt-in)
    explanation = None
    shap_json = None
    if explain:
        shap_data = pred_svc.get_shap_explanation(event_dict)
        if shap_data:
            explanation = [FeatureContribution(**f) for f in shap_data]
            shap_json = shap_data

    # 5. Save prediction to DB
    pred_record = Prediction(
        incident_id=incident.id,
        impact_tier=prediction_result["impact_tier"],
        impact_low_prob=prediction_result["impact_confidence"].get("Low", 0),
        impact_medium_prob=prediction_result["impact_confidence"].get("Medium", 0),
        impact_high_prob=prediction_result["impact_confidence"].get("High", 0),
        closure_probability=prediction_result["closure_probability"],
        expected_clearance_min=prediction_result["expected_clearance_min"],
        recommended_manpower=resource_plan["recommended_manpower"],
        recommended_barricades=resource_plan["recommended_barricades"],
        activate_diversion=resource_plan["activate_diversion_plan"],
        diversion_points=resource_plan["diversion_junction_points"],
        deployment_duration_min=resource_plan["deployment_duration_min"],
        rationale=resource_plan["rationale"],
        shap_explanation_json=shap_json,
    )
    db.add(pred_record)
    await db.flush()

    # 6. Evaluate alert thresholds
    await alert_svc.evaluate_and_create_alerts(db, pred_record, incident)

    # 7. Register deployment for constraint tracking
    rec_svc.register_deployment(incident.id, resource_plan)

    return PredictResponse(
        incident_id=incident.id,
        impact_tier=prediction_result["impact_tier"],
        impact_confidence=prediction_result["impact_confidence"],
        closure_probability=prediction_result["closure_probability"],
        expected_clearance_min=prediction_result["expected_clearance_min"],
        recommended_manpower=resource_plan["recommended_manpower"],
        recommended_barricades=resource_plan["recommended_barricades"],
        activate_diversion_plan=resource_plan["activate_diversion_plan"],
        diversion_junction_points=resource_plan["diversion_junction_points"],
        deployment_duration_min=resource_plan["deployment_duration_min"],
        rationale=resource_plan["rationale"],
        explanation=explanation,
    )


@router.post("/predict", response_model=PredictResponse, summary="Predict impact for a single event")
async def predict(
    event: PredictRequest,
    explain: bool = Query(False, description="Include SHAP feature explanations"),
    db: AsyncSession = Depends(get_db),
):
    """
    Submit a single traffic event and get:
    - Impact severity prediction (Low/Medium/High)
    - Road closure probability
    - Expected clearance time
    - Resource deployment recommendation
    - Optional SHAP feature explanations (set explain=true)
    """
    try:
        return await _process_single_prediction(event, db, explain=explain)
    except Exception as e:
        logger.exception("Prediction failed")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@router.post("/batch_predict", response_model=BatchPredictResponse, summary="Batch predict for multiple events")
async def batch_predict(
    batch: BatchPredictRequest,
    explain: bool = Query(False, description="Include SHAP feature explanations"),
    db: AsyncSession = Depends(get_db),
):
    """
    Submit up to 50 traffic events for batch prediction.
    Each event gets the full prediction + recommendation treatment.
    """
    results = []
    for event_req in batch.events:
        try:
            result = await _process_single_prediction(event_req, db, explain=explain)
            results.append(result)
        except Exception as e:
            logger.error("Batch item failed: %s", e)
            continue

    return BatchPredictResponse(predictions=results, total=len(results))
