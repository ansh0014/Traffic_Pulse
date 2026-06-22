"""
Resource Recommendation Engine
================================
Converts the outputs of the 3 ML models (impact tier, closure probability,
expected clearance time) into concrete field guidance: how many traffic
personnel to deploy, how much barricading, and whether to activate a
diversion plan.

IMPORTANT, STATED HONESTLY: the source dataset has no ground-truth
columns for "number of personnel deployed" or "number of barricades
used" - those outcomes were never logged. So this layer is necessarily
RULE-BASED, calibrated using the patterns we *can* verify in the data
(corridor designation, closure rate, duration by cause). It is meant
as a decision-support starting point for the police control room, not
a learned policy. As deployment data starts getting logged
(post-event personnel counts, actual barricade counts, citizen
complaint outcomes), this module should be replaced by a trained
policy model -- that data simply doesn't exist yet.

Run: python3 recommend.py   (demonstrates on a few sample events)
"""
import joblib
import pandas as pd
import numpy as np

MODEL_DIR = "Model"


class ResourceRecommender:
    def __init__(self):
        self.impact_model = joblib.load(f"{MODEL_DIR}/impact_severity_model.joblib")
        self.closure_model = joblib.load(f"{MODEL_DIR}/closure_model.joblib")
        self.duration_model = joblib.load(f"{MODEL_DIR}/duration_model.joblib")
        self.lookups = joblib.load(f"{MODEL_DIR}/historical_lookups.joblib")

    # ------------------------------------------------------------------
    def _featurize(self, event: dict) -> pd.DataFrame:
        """event: dict with keys event_type, event_cause, corridor, zone,
        veh_type, police_station, latitude, longitude, start_datetime (str/Timestamp)"""
        raw_ts = event["start_datetime"]
        try:
            ts = pd.Timestamp(raw_ts)
            if ts.tzinfo is not None:
                ts = ts.tz_convert("UTC").tz_localize(None)
        except Exception:
            ts = pd.Timestamp.now()

        # Pre-compute normalised strings so lookups are readable and unambiguous
        cause = str(event.get("event_cause", "others")).lower().strip()
        corridor = str(event.get("corridor", "Non-corridor")).strip()

        row = {
            "event_type": str(event.get("event_type", "unplanned")),
            "event_cause": cause,
            "corridor": corridor,
            "zone": str(event.get("zone", "Unknown")),
            "veh_type": str(event.get("veh_type", "Unknown")),
            "police_station": str(event.get("police_station", "Unknown")),
            "latitude": float(event.get("latitude", 12.97)),
            "longitude": float(event.get("longitude", 77.59)),
            "hour": int(ts.hour),
            "dow": int(ts.dayofweek),
            "month": int(ts.month),
            "is_weekend": int(ts.dayofweek >= 5),
            "is_peak_hour": int(ts.hour in [8, 9, 10, 17, 18, 19, 20]),
            "corridor_event_volume": self.lookups["corridor_event_volume"].get(corridor, 0),
            "cause_hist_closure_rate": self.lookups["cause_hist_closure_rate"].get(
                cause, self.lookups["global_closure_rate"]),
            "cause_hist_median_duration": self.lookups["cause_hist_median_duration"].get(
                cause, self.lookups["global_median_duration"]),
        }
        return pd.DataFrame([row])

    # ------------------------------------------------------------------
    def predict(self, event: dict) -> dict:
        X = self._featurize(event)
        impact_tier = self.impact_model.predict(X)[0]
        impact_proba = dict(zip(self.impact_model.classes_, self.impact_model.predict_proba(X)[0].round(2)))
        closure_proba = float(self.closure_model.predict_proba(X)[0][1])
        duration_pred = float(np.expm1(self.duration_model.predict(X)[0]))
        return {
            "impact_tier": impact_tier,
            "impact_tier_confidence": impact_proba,
            "closure_probability": round(closure_proba, 2),
            "expected_clearance_min": round(duration_pred, 1),
        }

    # ------------------------------------------------------------------
    def recommend(self, event: dict) -> dict:
        """Main entry point: predicted impact -> concrete resource plan."""
        pred = self.predict(event)
        tier = pred["impact_tier"]
        closure_p = pred["closure_probability"]
        is_corridor = event.get("corridor", "Non-corridor") != "Non-corridor"
        is_planned = event.get("event_type", "unplanned") == "planned"
        cause = str(event.get("event_cause", "others")).lower()

        # ---- manpower: base by impact tier, +escalation for corridor & planned mass events
        manpower_base = {"Low": 2, "Medium": 4, "High": 8}[tier]
        if is_corridor:
            manpower_base += 2          # arterial corridors need extra traffic management
        if is_planned and cause in ("public_event", "procession", "vip_movement", "protest"):
            manpower_base += 4          # planned mass-gathering events need crowd + traffic control combined
        if closure_p >= 0.5:
            manpower_base += 2          # closures need point-duty at every diversion junction

        # ---- barricading: scales with closure probability and tier
        if closure_p >= 0.5 or tier == "High":
            barricades = {"Low": 6, "Medium": 10, "High": 16}[tier]
        else:
            barricades = 0

        # ---- diversion plan: trigger + how many alternate junctions to staff
        diversion_needed = closure_p >= 0.4 or tier == "High"
        diversion_points = 0
        if diversion_needed:
            diversion_points = 2 if tier != "High" else 4

        # ---- deployment duration: how long to hold the resources (clearance + buffer)
        hold_minutes = max(60, round(pred["expected_clearance_min"] * 1.2))  # 20% buffer

        return {
            "predicted_impact_tier": tier,
            "impact_tier_confidence": pred["impact_tier_confidence"],
            "closure_probability": closure_p,
            "expected_clearance_min": pred["expected_clearance_min"],
            "recommended_manpower": manpower_base,
            "recommended_barricades": barricades,
            "activate_diversion_plan": diversion_needed,
            "diversion_junction_points_to_staff": diversion_points,
            "recommended_deployment_duration_min": hold_minutes,
            "rationale": (
                f"{tier}-impact {cause} on {'a named corridor' if is_corridor else 'a non-corridor road'}; "
                f"P(closure)={closure_p}, expected clearance ~{pred['expected_clearance_min']:.0f} min."
            ),
        }


if __name__ == "__main__":
    rec = ResourceRecommender()

    samples = [
        dict(event_type="unplanned", event_cause="vehicle_breakdown", corridor="Tumkur Road",
             zone="North Zone 1", veh_type="heavy_vehicle", police_station="Peenya",
             latitude=13.04, longitude=77.52, start_datetime="2024-04-10 09:15:00"),
        dict(event_type="planned", event_cause="public_event", corridor="Mysore Road",
             zone="West Zone 1", veh_type="Unknown", police_station="Rajajinagar",
             latitude=12.96, longitude=77.52, start_datetime="2024-04-10 18:00:00"),
        dict(event_type="unplanned", event_cause="tree_fall", corridor="Non-corridor",
             zone="Central Zone 2", veh_type="Unknown", police_station="Wilson Garden",
             latitude=12.95, longitude=77.58, start_datetime="2024-04-10 14:00:00"),
        dict(event_type="planned", event_cause="vip_movement", corridor="Bellary Road 1",
             zone="North Zone 2", veh_type="Unknown", police_station="Hebbal",
             latitude=13.03, longitude=77.59, start_datetime="2024-04-10 11:00:00"),
    ]

    for s in samples:
        print(f"\n--- {s['event_cause']} on {s['corridor']} ({s['event_type']}) ---")
        out = rec.recommend(s)
        for k, v in out.items():
            print(f"  {k}: {v}")
