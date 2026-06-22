"""
Traffic-Pulse — Prediction Service
===================================
Wraps the 3 ML models: impact severity, road closure, clearance time.
Handles featurization, prediction, and optional SHAP explanations.
"""
import logging
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from app.config import get_settings

logger = logging.getLogger("traffic_pulse.prediction")

# Feature columns expected by the sklearn pipelines
FEATURES_CAT = ["event_type", "event_cause", "corridor", "zone", "veh_type", "police_station"]
FEATURES_NUM = [
    "latitude", "longitude", "hour", "dow", "month",
    "is_weekend", "is_peak_hour",
    "corridor_event_volume", "cause_hist_closure_rate", "cause_hist_median_duration",
]


class PredictionService:
    """Loads trained ML models and produces predictions for traffic events."""

    def __init__(self):
        settings = get_settings()
        model_dir = settings.model_path

        logger.info("Loading ML models from %s", model_dir)
        self.impact_model = joblib.load(model_dir / "impact_severity_model.joblib")
        self.closure_model = joblib.load(model_dir / "closure_model.joblib")
        self.duration_model = joblib.load(model_dir / "duration_model.joblib")
        self.lookups = joblib.load(model_dir / "historical_lookups.joblib")
        logger.info("All models loaded successfully")

        self._impact_explainer = None

    def featurize(self, event: dict) -> pd.DataFrame:
        """Convert a raw event dict into a model-ready feature DataFrame."""
        # Robustly parse timestamp — handle both naive and tz-aware strings
        raw_ts = event["start_datetime"]
        try:
            ts = pd.Timestamp(raw_ts)
            if ts.tzinfo is not None:
                ts = ts.tz_convert("UTC").tz_localize(None)  # strip tz for feature extraction
        except Exception:
            logger.warning("Could not parse start_datetime %r, falling back to now", raw_ts)
            ts = pd.Timestamp.now()

        # Normalise cause and corridor up-front so they're reused safely in all lookups
        cause = str(event.get("event_cause", "others")).lower().strip()
        corridor = str(event.get("corridor", "Non-corridor")).strip()

        row = {
            "event_type": str(event.get("event_type", "unplanned")),
            "event_cause": cause,
            "corridor": corridor,
            "zone": str(event.get("zone", "Unknown")),
            "veh_type": str(event.get("veh_type", "Unknown")),
            "police_station": str(event.get("police_station", "Unknown")),
            # Coerce lat/lon to float in case they arrive as strings from JSON form data
            "latitude": float(event.get("latitude", 12.97)),
            "longitude": float(event.get("longitude", 77.59)),
            "hour": int(ts.hour),
            "dow": int(ts.dayofweek),
            "month": int(ts.month),
            "is_weekend": int(ts.dayofweek >= 5),
            "is_peak_hour": int(ts.hour in [8, 9, 10, 17, 18, 19, 20]),
            # Historical lookup features — use pre-computed `cause` and `corridor` strings
            "corridor_event_volume": self.lookups["corridor_event_volume"].get(corridor, 0),
            "cause_hist_closure_rate": self.lookups["cause_hist_closure_rate"].get(
                cause, self.lookups["global_closure_rate"]
            ),
            "cause_hist_median_duration": self.lookups["cause_hist_median_duration"].get(
                cause, self.lookups["global_median_duration"]
            ),
        }
        return pd.DataFrame([row])

    def predict(self, event: dict) -> dict:
        """
        Run all 3 models on a single event.

        Returns dict with:
            impact_tier, impact_confidence, closure_probability, expected_clearance_min
        """
        try:
            X = self.featurize(event)
        except Exception as exc:
            logger.error("Feature extraction failed for event %r: %s", event, exc, exc_info=True)
            raise ValueError(f"Feature extraction failed: {exc}") from exc

        try:
            # Impact severity
            impact_tier = self.impact_model.predict(X)[0]
            impact_proba = dict(
                zip(
                    self.impact_model.classes_,
                    self.impact_model.predict_proba(X)[0].round(4),
                )
            )
            # Ensure all tiers present even if a class wasn't in training
            for tier in ("Low", "Medium", "High"):
                impact_proba.setdefault(tier, 0.0)
        except Exception as exc:
            logger.error("Impact model inference failed: %s", exc, exc_info=True)
            raise ValueError(f"Impact severity model failed: {exc}") from exc

        try:
            # Road closure probability
            closure_proba = float(self.closure_model.predict_proba(X)[0][1])
        except Exception as exc:
            logger.warning("Closure model failed (%s), defaulting to 0.0", exc)
            closure_proba = 0.0

        try:
            # Clearance time (model predicts log1p, we invert)
            duration_pred = float(np.expm1(self.duration_model.predict(X)[0]))
            duration_pred = max(1.0, duration_pred)  # floor at 1 minute
        except Exception as exc:
            logger.warning("Duration model failed (%s), defaulting to global median", exc)
            duration_pred = float(self.lookups.get("global_median_duration", 60.0))

        return {
            "impact_tier": impact_tier,
            "impact_confidence": {k: round(float(v), 4) for k, v in impact_proba.items()},
            "closure_probability": round(closure_proba, 4),
            "expected_clearance_min": round(duration_pred, 1),
        }

    def get_shap_explanation(self, event: dict, top_n: int = 5) -> list[dict]:
        """
        Compute SHAP feature contributions for the impact severity prediction.
        Returns top N features with their contributions.
        """
        try:
            import shap

            # Lazy-init explainer (one-time cost ~2-5s)
            if self._impact_explainer is None:
                logger.info("Initializing SHAP TreeExplainer (one-time)")
                # Extract the classifier from the pipeline
                clf = self.impact_model.named_steps["clf"]
                self._impact_explainer = shap.TreeExplainer(clf)

            X = self.featurize(event)

            # Transform features through the pipeline's preprocessor
            preprocessor = self.impact_model.named_steps["prep"]
            X_transformed = preprocessor.transform(X)

            # Get feature names after preprocessing
            cat_names = list(
                preprocessor.transformers_[0][1].get_feature_names_out(FEATURES_CAT)
            )
            all_names = cat_names + FEATURES_NUM

            # Compute SHAP values
            shap_values = self._impact_explainer.shap_values(X_transformed)

            # Get the predicted class index
            predicted_tier = self.impact_model.predict(X)[0]
            class_idx = list(self.impact_model.classes_).index(predicted_tier)

            # Get SHAP values for predicted class
            if isinstance(shap_values, list):
                sv = shap_values[class_idx][0]
            else:
                sv = shap_values[0]

            # Build human-readable feature contributions
            feature_contributions = []
            for name, val in zip(all_names, sv):
                feature_contributions.append({"feature_raw": name, "contribution": float(val)})

            # Sort by absolute contribution, take top N
            feature_contributions.sort(key=lambda x: abs(x["contribution"]), reverse=True)
            top_features = feature_contributions[:top_n]

            # Format for output
            result = []
            total_abs = sum(abs(f["contribution"]) for f in top_features) or 1.0
            for f in top_features:
                contrib = f["contribution"]
                pct = abs(contrib) / total_abs * 100
                direction = "positive" if contrib > 0 else "negative"
                sign = "+" if contrib > 0 else "-"
                # Humanize feature name
                human_name = self._humanize_feature(f["feature_raw"])
                result.append({
                    "feature": human_name,
                    "value": f["feature_raw"],
                    "contribution": round(contrib, 4),
                    "direction": direction,
                    "percentage": f"{sign}{pct:.0f}%",
                })
            return result
        except Exception as e:
            logger.warning("SHAP explanation failed: %s", e)
            return []

    @staticmethod
    def _humanize_feature(raw_name: str) -> str:
        """Convert raw feature names to human-readable labels."""
        mapping = {
            "is_peak_hour": "Peak Hour",
            "is_weekend": "Weekend",
            "hour": "Time of Day",
            "dow": "Day of Week",
            "month": "Month",
            "latitude": "Location (Latitude)",
            "longitude": "Location (Longitude)",
            "corridor_event_volume": "Corridor Traffic Volume",
            "cause_hist_closure_rate": "Historical Closure Rate",
            "cause_hist_median_duration": "Historical Avg Duration",
        }
        # Check direct mapping first
        if raw_name in mapping:
            return mapping[raw_name]
        # Handle one-hot encoded categorical features
        if raw_name.startswith("event_type_"):
            return f"Event Type: {raw_name.replace('event_type_', '')}"
        if raw_name.startswith("event_cause_"):
            return f"Cause: {raw_name.replace('event_cause_', '')}"
        if raw_name.startswith("corridor_"):
            return f"Corridor: {raw_name.replace('corridor_', '')}"
        if raw_name.startswith("zone_"):
            return f"Zone: {raw_name.replace('zone_', '')}"
        if raw_name.startswith("veh_type_"):
            return f"Vehicle: {raw_name.replace('veh_type_', '')}"
        if raw_name.startswith("police_station_"):
            return f"Station: {raw_name.replace('police_station_', '')}"
        return raw_name


# Singleton instance (loaded once at app startup)
_prediction_service: PredictionService | None = None


def get_prediction_service() -> PredictionService:
    """Get or create the prediction service singleton."""
    global _prediction_service
    if _prediction_service is None:
        _prediction_service = PredictionService()
    return _prediction_service
