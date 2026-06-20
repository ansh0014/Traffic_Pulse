"""
Geospatial endpoints for map visualization.
"""
import logging
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Incident, Prediction

logger = logging.getLogger("traffic_pulse.api.geospatial")
router = APIRouter(tags=["Geospatial"])

# Approximate corridor polyline coordinates (Bengaluru major corridors)
CORRIDOR_COORDS = {
    "Mysore Road": [[12.9536, 77.5386], [12.9401, 77.5102], [12.9277, 77.4843]],
    "Tumkur Road": [[12.9954, 77.5537], [13.0168, 77.5301], [13.0400, 77.5181]],
    "Bellary Road 1": [[12.9876, 77.5890], [13.0042, 77.5850], [13.0200, 77.5830]],
    "Bellary Road 2": [[13.0200, 77.5830], [13.0350, 77.5810], [13.0500, 77.5790]],
    "Hosur Road": [[12.9345, 77.6104], [12.9100, 77.6200], [12.8900, 77.6350]],
    "Old Madras Road": [[12.9876, 77.6200], [13.0050, 77.6400], [13.0200, 77.6550]],
    "Magadi Road": [[12.9685, 77.5500], [12.9650, 77.5200], [12.9600, 77.4900]],
    "ORR North 1": [[13.0100, 77.5500], [13.0300, 77.5700], [13.0400, 77.5900]],
    "ORR East 1": [[12.9500, 77.6500], [12.9300, 77.6600], [12.9100, 77.6700]],
}


@router.get("/geospatial/incidents", summary="Incidents for map display")
async def geospatial_incidents(
    limit: int = Query(500, ge=1, le=2000, description="Max incidents to return"),
    impact_tier: str | None = Query(None, description="Filter by impact tier"),
    db: AsyncSession = Depends(get_db),
):
    """Returns incidents with lat/long, tier, and status for map rendering."""
    query = (
        select(Incident)
        .options(selectinload(Incident.predictions))
        .order_by(desc(Incident.created_at))
        .limit(limit)
    )

    result = await db.execute(query)
    incidents = result.scalars().all()

    features = []
    for inc in incidents:
        tier = None
        closure_p = None
        manpower = None
        if inc.predictions:
            latest = sorted(inc.predictions, key=lambda p: p.predicted_at, reverse=True)[0]
            tier = latest.impact_tier
            closure_p = latest.closure_probability
            manpower = latest.recommended_manpower

        # Apply filter if specified
        if impact_tier and tier != impact_tier:
            continue

        features.append({
            "id": inc.id,
            "latitude": inc.latitude,
            "longitude": inc.longitude,
            "event_type": inc.event_type,
            "event_cause": inc.event_cause,
            "corridor": inc.corridor,
            "zone": inc.zone,
            "status": inc.status,
            "start_datetime": inc.start_datetime.isoformat() if inc.start_datetime else None,
            "impact_tier": tier,
            "closure_probability": closure_p,
            "recommended_manpower": manpower,
        })

    return {"incidents": features, "total": len(features)}


@router.get("/geospatial/heatmap", summary="Heatmap data for incident density")
async def geospatial_heatmap(
    db: AsyncSession = Depends(get_db),
):
    """Returns [[lat, lng, intensity], ...] for the heatmap layer."""
    result = await db.execute(
        select(Incident.latitude, Incident.longitude)
        .options()
    )
    rows = result.all()

    # Each incident = 1 unit of intensity; could weight by impact tier later
    points = [[float(r[0]), float(r[1]), 1.0] for r in rows if r[0] and r[1]]
    return {"points": points, "total": len(points)}


@router.get("/geospatial/corridors", summary="Corridor polyline data")
async def geospatial_corridors():
    """Returns corridor metadata with approximate polyline coordinates."""
    corridors = []
    for name, coords in CORRIDOR_COORDS.items():
        corridors.append({
            "name": name,
            "coordinates": coords,
        })
    return {"corridors": corridors}
