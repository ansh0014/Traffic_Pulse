"""
GridLock 2.0 — Recommendation Service
========================================
Converts ML model predictions into concrete resource deployment plans.

Improved over the original fixed-rule engine:
  - Constraint-aware (respects available personnel/equipment pools)
  - Priority-based scaling when multiple events compete for resources
  - Flags understaffing risks
"""
import logging

logger = logging.getLogger("gridlock.recommendation")

# Default resource pools (configurable per deployment)
DEFAULT_PERSONNEL_POOL = 50
DEFAULT_BARRICADE_POOL = 100

# Mass-gathering event causes that need extra crowd control
MASS_GATHERING_CAUSES = {"public_event", "procession", "vip_movement", "protest", "rally"}


class RecommendationService:
    """Generates resource deployment recommendations from model predictions."""

    def __init__(
        self,
        personnel_pool: int = DEFAULT_PERSONNEL_POOL,
        barricade_pool: int = DEFAULT_BARRICADE_POOL,
    ):
        self.personnel_pool = personnel_pool
        self.barricade_pool = barricade_pool
        self.active_deployments: dict[int, dict] = {}  # incident_id -> deployed resources

    @property
    def available_personnel(self) -> int:
        used = sum(d.get("manpower", 0) for d in self.active_deployments.values())
        return max(0, self.personnel_pool - used)

    @property
    def available_barricades(self) -> int:
        used = sum(d.get("barricades", 0) for d in self.active_deployments.values())
        return max(0, self.barricade_pool - used)

    def recommend(self, prediction: dict, event: dict) -> dict:
        """
        Generate a resource plan from model predictions.

        Args:
            prediction: dict with impact_tier, closure_probability, expected_clearance_min
            event: dict with event_type, event_cause, corridor, etc.

        Returns:
            dict with recommended_manpower, recommended_barricades,
            activate_diversion_plan, diversion_junction_points,
            deployment_duration_min, rationale, warnings
        """
        tier = prediction["impact_tier"]
        closure_p = prediction["closure_probability"]
        clearance_min = prediction["expected_clearance_min"]

        is_corridor = event.get("corridor", "Non-corridor") != "Non-corridor"
        is_planned = event.get("event_type", "unplanned") == "planned"
        cause = str(event.get("event_cause", "others")).lower()

        warnings = []

        # ---- Manpower: base by impact tier + escalation modifiers
        manpower_base = {"Low": 2, "Medium": 4, "High": 8}.get(tier, 4)

        if is_corridor:
            manpower_base += 2  # Arterial corridors need extra traffic management

        if is_planned and cause in MASS_GATHERING_CAUSES:
            manpower_base += 4  # Crowd + traffic control combined

        if closure_p >= 0.5:
            manpower_base += 2  # Point-duty at every diversion junction

        # Constraint check: cap at available personnel
        if manpower_base > self.available_personnel:
            warnings.append(
                f"Understaffed: need {manpower_base} personnel but only "
                f"{self.available_personnel} available. Deploying {self.available_personnel}."
            )
            manpower_base = self.available_personnel

        # ---- Barricading: scales with closure probability and tier
        if closure_p >= 0.5 or tier == "High":
            barricades = {"Low": 6, "Medium": 10, "High": 16}.get(tier, 10)
        else:
            barricades = 0

        # Constraint check: cap at available barricades
        if barricades > self.available_barricades:
            warnings.append(
                f"Equipment shortage: need {barricades} barricades but only "
                f"{self.available_barricades} available."
            )
            barricades = self.available_barricades

        # ---- Diversion plan: trigger + alternate junctions to staff
        diversion_needed = closure_p >= 0.4 or tier == "High"
        diversion_points = 0
        if diversion_needed:
            diversion_points = 2 if tier != "High" else 4

        # ---- Deployment duration: clearance + 20% buffer, minimum 60 min
        hold_minutes = max(60, round(clearance_min * 1.2))

        # ---- Build rationale string
        rationale = (
            f"{tier}-impact {cause} on "
            f"{'a named corridor' if is_corridor else 'a non-corridor road'}; "
            f"P(closure)={closure_p:.2f}, "
            f"expected clearance ~{clearance_min:.0f} min."
        )
        if warnings:
            rationale += " ⚠️ " + " | ".join(warnings)

        return {
            "recommended_manpower": manpower_base,
            "recommended_barricades": barricades,
            "activate_diversion_plan": diversion_needed,
            "diversion_junction_points": diversion_points,
            "deployment_duration_min": hold_minutes,
            "rationale": rationale,
            "warnings": warnings,
        }

    def register_deployment(self, incident_id: int, plan: dict):
        """Track active deployments for constraint management."""
        self.active_deployments[incident_id] = {
            "manpower": plan["recommended_manpower"],
            "barricades": plan["recommended_barricades"],
        }
        logger.info(
            "Registered deployment for incident %d: %d personnel, %d barricades. "
            "Pool remaining: %d personnel, %d barricades",
            incident_id,
            plan["recommended_manpower"],
            plan["recommended_barricades"],
            self.available_personnel,
            self.available_barricades,
        )

    def release_deployment(self, incident_id: int):
        """Release resources when an incident is resolved."""
        if incident_id in self.active_deployments:
            del self.active_deployments[incident_id]
            logger.info("Released deployment for incident %d", incident_id)


# Singleton instance
_recommendation_service: RecommendationService | None = None


def get_recommendation_service() -> RecommendationService:
    global _recommendation_service
    if _recommendation_service is None:
        _recommendation_service = RecommendationService()
    return _recommendation_service
