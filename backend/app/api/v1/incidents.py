"""
Incident endpoints — GET /historical_incidents, GET /stats/overview
"""
import logging
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Incident, Prediction
from app.schemas.incident import IncidentOut, IncidentListResponse, StatsOverview

logger = logging.getLogger("traffic_pulse.api.incidents")
router = APIRouter(tags=["Incidents"])


@router.get("/historical_incidents", response_model=IncidentListResponse, summary="List historical incidents")
async def list_incidents(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    zone: str | None = Query(None, description="Filter by zone"),
    corridor: str | None = Query(None, description="Filter by corridor"),
    event_cause: str | None = Query(None, description="Filter by event cause"),
    impact_tier: str | None = Query(None, description="Filter by impact tier"),
    start_date: datetime | None = Query(None, description="Filter events after this date"),
    end_date: datetime | None = Query(None, description="Filter events before this date"),
    db: AsyncSession = Depends(get_db),
):
    """Paginated, filterable list of historical incidents with their predictions."""
    # Build query
    query = select(Incident).order_by(desc(Incident.start_datetime))
    count_query = select(func.count(Incident.id))

    # Apply filters
    if zone:
        query = query.where(Incident.zone == zone)
        count_query = count_query.where(Incident.zone == zone)
    if corridor:
        query = query.where(Incident.corridor == corridor)
        count_query = count_query.where(Incident.corridor == corridor)
    if event_cause:
        query = query.where(Incident.event_cause == event_cause)
        count_query = count_query.where(Incident.event_cause == event_cause)
    if start_date:
        query = query.where(Incident.start_datetime >= start_date)
        count_query = count_query.where(Incident.start_datetime >= start_date)
    if end_date:
        query = query.where(Incident.start_datetime <= end_date)
        count_query = count_query.where(Incident.start_datetime <= end_date)

    # Impact tier filter requires join
    if impact_tier:
        query = query.join(Prediction, Incident.id == Prediction.incident_id).where(
            Prediction.impact_tier == impact_tier
        )
        count_query = count_query.join(Prediction, Incident.id == Prediction.incident_id).where(
            Prediction.impact_tier == impact_tier
        )

    # Total count
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Paginate
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    result = await db.execute(query.options(selectinload(Incident.predictions)))
    incidents = result.scalars().all()

    # Build response with latest prediction data
    incident_list = []
    for inc in incidents:
        out = IncidentOut(
            id=inc.id,
            event_type=inc.event_type,
            event_cause=inc.event_cause,
            corridor=inc.corridor,
            zone=inc.zone,
            veh_type=inc.veh_type,
            police_station=inc.police_station,
            latitude=inc.latitude,
            longitude=inc.longitude,
            start_datetime=inc.start_datetime,
            status=inc.status,
            address=inc.address,
            created_at=inc.created_at,
        )
        # Attach latest prediction if any
        if inc.predictions:
            latest = sorted(inc.predictions, key=lambda p: p.predicted_at or datetime.min, reverse=True)[0]
            out.impact_tier = latest.impact_tier
            out.closure_probability = latest.closure_probability
            out.expected_clearance_min = latest.expected_clearance_min
            out.recommended_manpower = latest.recommended_manpower
        incident_list.append(out)

    return IncidentListResponse(
        incidents=incident_list,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/stats/overview", response_model=StatsOverview, summary="Dashboard summary statistics")
async def stats_overview(
    db: AsyncSession = Depends(get_db),
):
    """Aggregate statistics for the dashboard: counts, distributions, averages."""
    # Total incidents
    total_result = await db.execute(select(func.count(Incident.id)))
    total_incidents = total_result.scalar() or 0

    # Active incidents
    active_result = await db.execute(
        select(func.count(Incident.id)).where(Incident.status == "active")
    )
    active_incidents = active_result.scalar() or 0

    # Impact tier counts
    high_result = await db.execute(
        select(func.count(Prediction.id)).where(Prediction.impact_tier == "High")
    )
    high_count = high_result.scalar() or 0

    medium_result = await db.execute(
        select(func.count(Prediction.id)).where(Prediction.impact_tier == "Medium")
    )
    medium_count = medium_result.scalar() or 0

    low_result = await db.execute(
        select(func.count(Prediction.id)).where(Prediction.impact_tier == "Low")
    )
    low_count = low_result.scalar() or 0

    # Averages
    avg_clearance_result = await db.execute(
        select(func.avg(Prediction.expected_clearance_min))
    )
    avg_clearance = avg_clearance_result.scalar() or 0.0

    avg_closure_result = await db.execute(
        select(func.avg(Prediction.closure_probability))
    )
    avg_closure = avg_closure_result.scalar() or 0.0

    # Incidents by zone
    zone_result = await db.execute(
        select(Incident.zone, func.count(Incident.id)).group_by(Incident.zone)
    )
    incidents_by_zone = {row[0]: row[1] for row in zone_result.all()}

    # Incidents by cause
    cause_result = await db.execute(
        select(Incident.event_cause, func.count(Incident.id)).group_by(Incident.event_cause)
    )
    incidents_by_cause = {row[0]: row[1] for row in cause_result.all()}

    # Incidents by hour
    # Note: SQLite doesn't have EXTRACT, so we store hour info at prediction time
    # For now, return empty — will be populated as incidents come in
    incidents_by_hour: dict[int, int] = {}

    # Recent incidents (last 10)
    recent_result = await db.execute(
        select(Incident)
        .options(selectinload(Incident.predictions))
        .order_by(desc(Incident.created_at))
        .limit(10)
    )
    recent_incidents = []
    for inc in recent_result.scalars().all():
        out = IncidentOut(
            id=inc.id,
            event_type=inc.event_type,
            event_cause=inc.event_cause,
            corridor=inc.corridor,
            zone=inc.zone,
            veh_type=inc.veh_type,
            police_station=inc.police_station,
            latitude=inc.latitude,
            longitude=inc.longitude,
            start_datetime=inc.start_datetime,
            status=inc.status,
            address=inc.address,
            created_at=inc.created_at,
        )
        if inc.predictions:
            latest = sorted(inc.predictions, key=lambda p: p.predicted_at or datetime.min, reverse=True)[0]
            out.impact_tier = latest.impact_tier
            out.closure_probability = latest.closure_probability
            out.expected_clearance_min = latest.expected_clearance_min
            out.recommended_manpower = latest.recommended_manpower
        recent_incidents.append(out)

    return StatsOverview(
        total_incidents=total_incidents,
        active_incidents=active_incidents,
        high_impact_count=high_count,
        medium_impact_count=medium_count,
        low_impact_count=low_count,
        avg_clearance_min=round(float(avg_clearance), 1),
        avg_closure_probability=round(float(avg_closure), 4),
        incidents_by_zone=incidents_by_zone,
        incidents_by_cause=incidents_by_cause,
        incidents_by_hour=incidents_by_hour,
        recent_incidents=recent_incidents,
    )
