"""
Traffic Pulse — FastAPI Application Entry Point
"""
import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.config import get_settings
from backend.app.database import init_db
from backend.app.api.v1.router import api_v1_router
from backend.app.services.prediction import get_prediction_service

logger = logging.getLogger("traffic_pulse")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown."""
    logger.info("Traffic Pulse starting up...")

    await init_db()
    logger.info("Database ready")

    try:
        get_prediction_service()
        logger.info("ML models loaded")
    except Exception as e:
        logger.error("ML models failed to load: %s", e)

    yield

    logger.info("Traffic Pulse shutting down")


settings = get_settings()

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

app = FastAPI(
    title="Traffic Pulse — Smart Traffic Management Platform",
    description=(
        "Real-time traffic impact forecasting and resource deployment recommendation "
        "system for Bengaluru Traffic Police. Powered by ML models trained on 8,173+ "
        "historical traffic events."
    ),
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    ms = (time.perf_counter() - start) * 1000

    path = request.url.path
    if path not in ("/api/v1/health", "/favicon.ico", "/"):
        logger.info("%s %s %d %.0fms", request.method, path, response.status_code, ms)

    response.headers["X-Process-Time-Ms"] = f"{ms:.1f}"
    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error."},
    )


app.include_router(api_v1_router)


@app.get("/", include_in_schema=False)
async def root():
    return {
        "service": "Traffic Pulse — Smart Traffic Management Platform",
        "version": "2.0.0",
        "docs": "/docs",
        "health": "/api/v1/health",
    }
