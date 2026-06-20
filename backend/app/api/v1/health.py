"""
Health check endpoint.
"""
from fastapi import APIRouter

from backend.app.services.prediction import get_prediction_service

router = APIRouter(tags=["Health"])


@router.get("/health", summary="System health check")
async def health_check():
    """Returns system health status and model load state."""
    try:
        svc = get_prediction_service()
        models_loaded = all([
            svc.impact_model is not None,
            svc.closure_model is not None,
            svc.duration_model is not None,
        ])
    except Exception:
        models_loaded = False

    return {
        "status": "healthy" if models_loaded else "degraded",
        "models_loaded": models_loaded,
        "version": "2.0.0",
        "service": "GridLock Traffic Management Platform",
    }
