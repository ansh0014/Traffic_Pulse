"""
GridLock 2.0 — FastAPI Application
=====================================
Smart Traffic Management Platform for Bengaluru Traffic Police.

Main application entry point: sets up CORS, middleware, lifespan events,
and mounts all API routes.
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

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("gridlock")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    logger.info("🚦 GridLock 2.0 starting up...")

    # Initialize database tables
    await init_db()
    logger.info("✅ Database initialized")

    # Pre-load ML models (fail fast if models missing)
    try:
        svc = get_prediction_service()
        logger.info("✅ ML models loaded successfully")
    except Exception as e:
        logger.error("❌ Failed to load ML models: %s", e)
        logger.error("   Make sure model .joblib files exist in the Model/ directory")

    yield

    logger.info("🛑 GridLock 2.0 shutting down...")


# Create FastAPI app
settings = get_settings()

app = FastAPI(
    title="GridLock 2.0 — Smart Traffic Management Platform",
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

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log every API request with timing."""
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start) * 1000

    # Skip logging for health checks and static files
    path = request.url.path
    if path not in ("/api/v1/health", "/favicon.ico"):
        logger.info(
            "%s %s → %d (%.1fms)",
            request.method, path, response.status_code, duration_ms,
        )

    response.headers["X-Process-Time-Ms"] = f"{duration_ms:.1f}"
    return response


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Check server logs for details."},
    )


# Mount API routes
app.include_router(api_v1_router)


# Root redirect to docs
@app.get("/", include_in_schema=False)
async def root():
    return {
        "service": "GridLock 2.0 — Smart Traffic Management Platform",
        "version": "2.0.0",
        "docs": "/docs",
        "health": "/api/v1/health",
    }
