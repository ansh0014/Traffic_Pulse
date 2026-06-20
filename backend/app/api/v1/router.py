"""
API v1 router — aggregates all v1 route modules.
"""
from fastapi import APIRouter

from app.api.v1.health import router as health_router
from app.api.v1.predict import router as predict_router
from app.api.v1.incidents import router as incidents_router
from app.api.v1.metrics import router as metrics_router
from app.api.v1.alerts import router as alerts_router
from app.api.v1.geospatial import router as geospatial_router

api_v1_router = APIRouter(prefix="/api/v1")

api_v1_router.include_router(health_router)
api_v1_router.include_router(predict_router)
api_v1_router.include_router(incidents_router)
api_v1_router.include_router(metrics_router)
api_v1_router.include_router(alerts_router)
api_v1_router.include_router(geospatial_router)
