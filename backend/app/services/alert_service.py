"""
Traffic Pulse — Alert Service
==============================
Generates alerts when predictions cross configured thresholds.
Supports dashboard notifications and optional email via SMTP.
"""
import logging
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models import Alert, Prediction, Incident

logger = logging.getLogger("traffic_pulse.alerts")


class AlertService:
    """Evaluates predictions against thresholds and generates alerts."""

    def __init__(self):
        settings = get_settings()
        self.clearance_threshold = settings.high_impact_clearance_threshold_min
        self.closure_threshold = settings.closure_prob_alert_threshold
        self.email_enabled = settings.email_enabled
        self.recipients = settings.alert_recipient_list

    async def evaluate_and_create_alerts(
        self,
        db: AsyncSession,
        prediction: Prediction,
        incident: Incident,
    ) -> list[Alert]:
        """
        Check prediction against thresholds and create Alert records.
        Returns list of created alerts.
        """
        alerts_created = []

        # 1. High impact tier → CRITICAL
        if prediction.impact_tier == "High":
            alert = Alert(
                prediction_id=prediction.id,
                alert_type="high_impact",
                severity="critical",
                message=(
                    f"🔴 HIGH IMPACT: {incident.event_cause} on {incident.corridor} "
                    f"({incident.zone}). Recommended {prediction.recommended_manpower} personnel, "
                    f"{prediction.recommended_barricades} barricades."
                ),
            )
            db.add(alert)
            alerts_created.append(alert)

        # 2. High closure probability → WARNING
        if prediction.closure_probability >= self.closure_threshold:
            alert = Alert(
                prediction_id=prediction.id,
                alert_type="closure_risk",
                severity="warning",
                message=(
                    f" CLOSURE RISK: {prediction.closure_probability:.0%} probability of road closure "
                    f"for {incident.event_cause} on {incident.corridor}. "
                    f"Diversion plan {'activated' if prediction.activate_diversion else 'recommended'}."
                ),
            )
            db.add(alert)
            alerts_created.append(alert)

        # 3. Long clearance time → WARNING
        if prediction.expected_clearance_min >= self.clearance_threshold:
            hours = prediction.expected_clearance_min / 60
            alert = Alert(
                prediction_id=prediction.id,
                alert_type="long_clearance",
                severity="warning",
                message=(
                    f"⏱️ LONG CLEARANCE: Estimated {hours:.1f} hours to clear "
                    f"{incident.event_cause} on {incident.corridor}. "
                    f"Deploy resources for {prediction.deployment_duration_min} min."
                ),
            )
            db.add(alert)
            alerts_created.append(alert)

        if alerts_created:
            await db.flush()
            logger.info(
                "Created %d alert(s) for prediction %d (incident %d)",
                len(alerts_created), prediction.id, incident.id,
            )

            # Send email if configured
            if self.email_enabled and self.recipients:
                await self._send_email_alerts(alerts_created, incident)

        return alerts_created

    async def _send_email_alerts(self, alerts: list[Alert], incident: Incident):
        """Send email notifications for alerts. Fails gracefully."""
        try:
            import aiosmtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart

            settings = get_settings()

            subject = f"Traffic Pulse Alert: {incident.event_cause} on {incident.corridor}"
            body_lines = [f"<h2>Traffic Pulse Alert</h2>"]
            for alert in alerts:
                color = {"critical": "#ef4444", "warning": "#f59e0b", "info": "#3b82f6"}
                body_lines.append(
                    f'<p style="color:{color.get(alert.severity, "#333")}; font-weight:bold;">'
                    f'{alert.message}</p>'
                )
            body_lines.append(
                f"<hr><p>Incident: {incident.event_cause} | "
                f"Location: {incident.latitude:.4f}, {incident.longitude:.4f} | "
                f"Time: {incident.start_datetime}</p>"
            )

            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = settings.smtp_user
            msg["To"] = ", ".join(self.recipients)
            msg.attach(MIMEText("\n".join(body_lines), "html"))

            await aiosmtplib.send(
                msg,
                hostname=settings.smtp_host,
                port=settings.smtp_port,
                username=settings.smtp_user,
                password=settings.smtp_password,
                use_tls=True,
            )

            # Mark alerts as email_sent
            for alert in alerts:
                alert.email_sent = True

            logger.info("Email alerts sent to %s", self.recipients)

        except Exception as e:
            logger.warning("Failed to send email alerts: %s", e)


# Singleton
_alert_service: AlertService | None = None


def get_alert_service() -> AlertService:
    global _alert_service
    if _alert_service is None:
        _alert_service = AlertService()
    return _alert_service
