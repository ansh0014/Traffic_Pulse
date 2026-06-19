"""
Event-Driven Congestion: Traffic Impact Forecasting Model
============================================================
IMPORTANT DATA FINDING:
  The raw `priority` field (High/Low) is NOT a genuine traffic-impact
  signal - it is a deterministic operational tag: every event on a
  named corridor is auto-tagged High, every non-corridor event is
  auto-tagged Low (verified: 5,030/5,049 corridor events = High,
  3,122/3,141 non-corridor events = Low). Training a classifier on it
  hits 100% accuracy trivially and teaches us nothing. So instead of
  reusing `priority`, this pipeline builds its own evidence-based
  "Impact Severity" label from the two things that actually describe
  real-world disruption: how long the road stayed disrupted
  (duration_min) and whether a closure was needed.

Trains 3 models from historical Astram event data:
  1. Impact-severity classifier -> Low / Medium / High impact tier
     (built from duration + closure, NOT the trivial priority field)
  2. Road-closure classifier    -> P(requires_road_closure)
  3. Clearance-time regressor   -> minutes-to-clear (log-target)

All categorical "historical rate" features are computed on the TRAIN
split only and applied forward to the TEST split, mirroring real
deployment (use only what happened in the past to score new events).

These three predictions feed a rule-based Resource Recommendation
Engine (see recommend.py) that converts "predicted impact" into
"manpower / barricading / diversion" guidance.

Run: python3 train_impact_model.py
"""
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import (classification_report, roc_auc_score,
                              mean_absolute_error, r2_score)

DATA_PATH = "Astram event data_anonymized - Astram event data_anonymizedb40ac87.csv"
RANDOM_STATE = 42

# ----------------------------------------------------------------------------
# 1. LOAD + CLEAN
# ----------------------------------------------------------------------------
def load_data(path=DATA_PATH):
    df = pd.read_csv(path, low_memory=False)
    df["start_datetime"] = pd.to_datetime(df["start_datetime"], errors="coerce", utc=True)
    df["modified_datetime"] = pd.to_datetime(df["modified_datetime"], errors="coerce", utc=True)

    # drop rows with no start time (shouldn't happen, but be safe)
    df = df.dropna(subset=["start_datetime"]).copy()

    # ---- requires_road_closure already boolean -> int target
    df["requires_road_closure"] = df["requires_road_closure"].astype(bool).astype(int)

    # ---- clearance duration (minutes), proxy = modified_datetime - start_datetime
    #      modified_datetime ~= closed_datetime for closed/resolved rows (verified empirically,
    #      median gap is sub-millisecond)
    resolved_mask = df["status"].isin(["closed", "resolved"])
    df["duration_min"] = np.nan
    df.loc[resolved_mask, "duration_min"] = (
        df.loc[resolved_mask, "modified_datetime"] - df.loc[resolved_mask, "start_datetime"]
    ).dt.total_seconds() / 60

    # clean obviously bad durations (negative, or absurd >7 days = data entry errors)
    df.loc[df["duration_min"] < 1, "duration_min"] = np.nan
    df.loc[df["duration_min"] > 7 * 24 * 60, "duration_min"] = np.nan

    # ---- time-derived features
    df["hour"] = df["start_datetime"].dt.hour
    df["dow"] = df["start_datetime"].dt.dayofweek          # 0=Mon
    df["month"] = df["start_datetime"].dt.month
    df["is_weekend"] = (df["dow"] >= 5).astype(int)
    df["is_peak_hour"] = df["hour"].isin([8, 9, 10, 17, 18, 19, 20]).astype(int)

    # ---- categorical cleanup
    for c in ["corridor", "zone", "veh_type", "police_station", "event_cause", "event_type"]:
        df[c] = df[c].fillna("Unknown").astype(str).str.strip()
    df["event_cause"] = df["event_cause"].str.lower()       # fix Debris/debris dup, Fog casing etc.

    return df


FEATURES_CAT = ["event_type", "event_cause", "corridor", "zone", "veh_type", "police_station"]
FEATURES_NUM = ["latitude", "longitude", "hour", "dow", "month",
                "is_weekend", "is_peak_hour",
                "corridor_event_volume", "cause_hist_closure_rate", "cause_hist_median_duration"]


def add_historical_features(train, test):
    """Compute historical-rate features on TRAIN only, then map onto both
    train and test. This mirrors production use: at prediction time you
    only know what has happened so far, never the future."""
    corridor_counts = train["corridor"].value_counts()
    cause_closure_rate = train.groupby("event_cause")["requires_road_closure"].mean()
    cause_median_dur = train.groupby("event_cause")["duration_min"].median()

    global_closure_rate = train["requires_road_closure"].mean()
    global_median_dur = train["duration_min"].median()

    for part in (train, test):
        part["corridor_event_volume"] = part["corridor"].map(corridor_counts).fillna(0)
        part["cause_hist_closure_rate"] = part["event_cause"].map(cause_closure_rate).fillna(global_closure_rate)
        part["cause_hist_median_duration"] = part["event_cause"].map(cause_median_dur).fillna(global_median_dur)
    return train, test


def build_impact_severity_label(train, test):
    """Evidence-based impact tier (Low/Medium/High), built from duration_min
    and requires_road_closure - NOT the trivial `priority` field. Tertile-style
    cut-points are learned on TRAIN only, then applied to TEST."""
    def score(d):
        dur = d["duration_min"].fillna(d["duration_min"].median())
        return dur * 1.0 + d["requires_road_closure"] * 240.0  # closure ~ worth 4 extra hours of disruption

    train_score = score(train)
    q1, q2 = train_score.quantile([0.5, 0.85])  # Low <=50th pct, Medium 50-85th, High >85th
    print(f"Impact-severity cut points learned on TRAIN -> Low<= {q1:.0f}, Medium<= {q2:.0f} (score units)")

    def tier(s):
        return np.select([s <= q1, s <= q2], ["Low", "Medium"], default="High")

    train_tier = tier(train_score)
    test_tier = tier(score(test))
    return train_tier, test_tier


def make_preprocessor():
    return ColumnTransformer([
        ("cat", OneHotEncoder(handle_unknown="ignore"), FEATURES_CAT),
        ("num", StandardScaler(), FEATURES_NUM),
    ])


def time_split(df, test_frac=0.2):
    """Forecasting use-case => split by TIME, not randomly (train on past, test on future)."""
    df_sorted = df.sort_values("start_datetime")
    cutoff = int(len(df_sorted) * (1 - test_frac))
    train = df_sorted.iloc[:cutoff]
    test = df_sorted.iloc[cutoff:]
    return train, test


def main():
    df = load_data()
    print(f"Rows after cleaning: {len(df)} | date range {df.start_datetime.min()} -> {df.start_datetime.max()}")

    train, test = time_split(df)
    print(f"Train: {len(train)}  Test (future window): {len(test)}")

    # leakage-free historical features (fit on train, applied to both)
    train, test = add_historical_features(train, test)

    # evidence-based impact severity tiers (replaces the trivial `priority` field)
    train["impact_tier"], test["impact_tier"] = build_impact_severity_label(train, test)
    print("Train impact tier distribution:\n", train["impact_tier"].value_counts())

    X_train = train[FEATURES_CAT + FEATURES_NUM]
    X_test = test[FEATURES_CAT + FEATURES_NUM]

    # ============================================================
    # MODEL 1: Impact-severity classifier (Low / Medium / High)
    # ============================================================
    y_train_imp, y_test_imp = train["impact_tier"], test["impact_tier"]
    imp_pipe = Pipeline([
        ("prep", make_preprocessor()),
        ("clf", RandomForestClassifier(n_estimators=300, max_depth=12,
                                        class_weight="balanced", random_state=RANDOM_STATE, n_jobs=-1)),
    ])
    imp_pipe.fit(X_train, y_train_imp)
    imp_pred = imp_pipe.predict(X_test)
    print("\n=== Impact-severity model (Low/Medium/High) ===")
    print(classification_report(y_test_imp, imp_pred))

    # ============================================================
    # MODEL 2: Road-closure classifier
    # ============================================================
    y_train_clo, y_test_clo = train["requires_road_closure"], test["requires_road_closure"]
    clo_pipe = Pipeline([
        ("prep", make_preprocessor()),
        ("clf", RandomForestClassifier(n_estimators=300, max_depth=14,
                                        class_weight="balanced", random_state=RANDOM_STATE, n_jobs=-1)),
    ])
    clo_pipe.fit(X_train, y_train_clo)
    clo_pred = clo_pipe.predict(X_test)
    clo_proba = clo_pipe.predict_proba(X_test)[:, 1]
    print("\n=== Road-closure model ===")
    print(classification_report(y_test_clo, clo_pred, target_names=["No closure", "Closure"]))
    print("ROC-AUC:", round(roc_auc_score(y_test_clo, clo_proba), 3))

    # ============================================================
    # MODEL 3: Clearance-time regressor (minutes), log target
    # ============================================================
    dur_train_mask = train["duration_min"].notna()
    dur_test_mask = test["duration_min"].notna()
    X_train_dur = X_train[dur_train_mask]
    X_test_dur = X_test[dur_test_mask]
    y_train_dur = np.log1p(train.loc[dur_train_mask, "duration_min"])
    y_test_dur = test.loc[dur_test_mask, "duration_min"]

    dur_pipe = Pipeline([
        ("prep", make_preprocessor()),
        ("reg", RandomForestRegressor(n_estimators=300, max_depth=12,
                                       min_samples_leaf=5,
                                       random_state=RANDOM_STATE, n_jobs=-1)),
    ])
    dur_pipe.fit(X_train_dur, y_train_dur)
    dur_pred = np.expm1(dur_pipe.predict(X_test_dur))
    print("\n=== Clearance-time model (minutes) ===")
    print("MAE:", round(mean_absolute_error(y_test_dur, dur_pred), 1), "minutes")
    print("R2 (log space):", round(r2_score(np.log1p(y_test_dur), dur_pipe.predict(X_test_dur)), 3))
    print("Median actual duration (test):", round(y_test_dur.median(), 1),
          "min  |  Median predicted:", round(np.median(dur_pred), 1), "min")
    # naive baseline for comparison: always predict train median
    baseline_pred = np.full_like(y_test_dur, train["duration_min"].median(), dtype=float)
    print("Baseline (predict train-median always) MAE:",
          round(mean_absolute_error(y_test_dur, baseline_pred), 1), "minutes")

    # ============================================================
    # Save artifacts (models + the historical lookup tables they depend on)
    # ============================================================
    joblib.dump(imp_pipe, "./impact_severity_model.joblib")
    joblib.dump(clo_pipe, "./closure_model.joblib")
    joblib.dump(dur_pipe, "./duration_model.joblib")

    lookups = {
        "corridor_event_volume": train["corridor"].value_counts().to_dict(),
        "cause_hist_closure_rate": train.groupby("event_cause")["requires_road_closure"].mean().to_dict(),
        "cause_hist_median_duration": train.groupby("event_cause")["duration_min"].median().to_dict(),
        "global_closure_rate": float(train["requires_road_closure"].mean()),
        "global_median_duration": float(train["duration_min"].median()),
    }
    joblib.dump(lookups, "./historical_lookups.joblib")
    print("\nSaved: impact_severity_model.joblib, closure_model.joblib, duration_model.joblib, historical_lookups.joblib")

    # feature importance for impact-severity model (top real drivers, no leakage)
    cat_names = list(imp_pipe.named_steps["prep"].transformers_[0][1].get_feature_names_out(FEATURES_CAT))
    all_names = cat_names + FEATURES_NUM
    importances = imp_pipe.named_steps["clf"].feature_importances_
    top = pd.Series(importances, index=all_names).sort_values(ascending=False).head(15)
    print("\nTop 15 impact-severity drivers:\n", top)


if __name__ == "__main__":
    main()
