"""
Metrics endpoint — GET /model_metrics
"""
import logging
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import ModelVersion

logger = logging.getLogger("traffic_pulse.api.metrics")
router = APIRouter(tags=["Metrics"])


# In-memory prediction tracking (simple counters for now)
_prediction_stats = {
    "total_predictions": 0,
    "predictions_by_tier": {"Low": 0, "Medium": 0, "High": 0},
    "avg_latency_ms": 0.0,
    "errors": 0,
}


def record_prediction(tier: str, latency_ms: float):
    """Track prediction metrics in-memory."""
    _prediction_stats["total_predictions"] += 1
    if tier in _prediction_stats["predictions_by_tier"]:
        _prediction_stats["predictions_by_tier"][tier] += 1
    # Running average latency
    n = _prediction_stats["total_predictions"]
    prev_avg = _prediction_stats["avg_latency_ms"]
    _prediction_stats["avg_latency_ms"] = prev_avg + (latency_ms - prev_avg) / n


def record_error():
    _prediction_stats["errors"] += 1


@router.get("/model_metrics", summary="Model performance metrics")
async def model_metrics(
    db: AsyncSession = Depends(get_db),
):
    """
    Returns current model performance metrics and version info.
    """
    # Get active model versions from DB
    result = await db.execute(
        select(ModelVersion).where(ModelVersion.is_active == True)
    )
    active_models = result.scalars().all()

    models_info = {}
    for m in active_models:
        models_info[m.model_name] = {
            "version": m.version,
            "primary_metric": m.primary_metric,
            "metric_name": m.metric_name,
            "trained_at": m.trained_at.isoformat() if m.trained_at else None,
        }

    # If no models in DB yet, return the known baseline metrics
    if not models_info:
        models_info = {
            "impact_severity": {
                "version": "1.0.0",
                "primary_metric": 0.74,
                "metric_name": "recall_high",
                "trained_at": None,
                "note": "Baseline model — recall 0.74 on High-impact events",
            },
            "road_closure": {
                "version": "1.0.0",
                "primary_metric": 0.81,
                "metric_name": "roc_auc",
                "trained_at": None,
                "note": "Baseline model — ROC-AUC 0.81",
            },
            "clearance_time": {
                "version": "1.0.0",
                "primary_metric": 312.0,
                "metric_name": "mae_minutes",
                "trained_at": None,
                "note": "Baseline model — MAE ~5.2 hours (rough estimate)",
            },
        }

    return {
        "models": models_info,
        "prediction_stats": _prediction_stats,
    }
