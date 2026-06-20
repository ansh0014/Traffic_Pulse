"""
Alert endpoints — GET /alerts, PATCH /alerts/{id}/read
"""
import logging
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Alert, Prediction, Incident
from app.schemas.alert import AlertOut, AlertListResponse, AlertMarkRead

logger = logging.getLogger("traffic_pulse.api.alerts")
router = APIRouter(tags=["Alerts"])


@router.get("/alerts", response_model=AlertListResponse, summary="List alerts")
async def list_alerts(
    severity: str | None = Query(None, description="Filter by severity: critical, warning, info"),
    is_read: bool | None = Query(None, description="Filter by read status"),
    limit: int = Query(50, ge=1, le=200, description="Max number of alerts"),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve recent alerts, optionally filtered by severity and read status."""
    query = (
        select(Alert)
        .join(Prediction, Alert.prediction_id == Prediction.id)
        .join(Incident, Prediction.incident_id == Incident.id)
        .order_by(desc(Alert.created_at))
    )

    if severity:
        query = query.where(Alert.severity == severity)
    if is_read is not None:
        query = query.where(Alert.is_read == is_read)

    query = query.limit(limit)

    result = await db.execute(query)
    alert_rows = result.scalars().all()

    # Unread count (regardless of filters)
    unread_result = await db.execute(
        select(func.count(Alert.id)).where(Alert.is_read == False)
    )
    unread_count = unread_result.scalar() or 0

    # Build response with denormalized incident info
    alerts_out = []
    for alert in alert_rows:
        # Fetch related prediction and incident
        pred_result = await db.execute(
            select(Prediction).where(Prediction.id == alert.prediction_id)
        )
        pred = pred_result.scalar_one_or_none()

        inc = None
        if pred:
            inc_result = await db.execute(
                select(Incident).where(Incident.id == pred.incident_id)
            )
            inc = inc_result.scalar_one_or_none()

        alerts_out.append(AlertOut(
            id=alert.id,
            prediction_id=alert.prediction_id,
            alert_type=alert.alert_type,
            severity=alert.severity,
            message=alert.message,
            is_read=alert.is_read,
            email_sent=alert.email_sent,
            created_at=alert.created_at,
            event_cause=inc.event_cause if inc else None,
            corridor=inc.corridor if inc else None,
            impact_tier=pred.impact_tier if pred else None,
        ))

    return AlertListResponse(
        alerts=alerts_out,
        total=len(alerts_out),
        unread_count=unread_count,
    )


@router.patch("/alerts/{alert_id}/read", response_model=AlertMarkRead, summary="Mark alert as read")
async def mark_alert_read(
    alert_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Mark a specific alert as read."""
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()

    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found")

    alert.is_read = True
    await db.flush()

    return AlertMarkRead(id=alert.id, is_read=True)
