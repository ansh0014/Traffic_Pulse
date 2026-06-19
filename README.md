# Event-Driven Congestion — Traffic Impact Forecasting & Resource Recommendation

Built from `Astram_event_data_anonymized.csv` — 8,173 traffic events logged by
Bengaluru traffic police, Nov 2023–Apr 2024 (planned events: rallies/VIP
movement/processions; unplanned: breakdowns, accidents, tree falls, potholes,
water-logging, construction, etc).

## Files
- `train_impact_model.py` — cleans the data, engineers features, trains and
  evaluates 3 models, saves them + the historical lookup tables they depend on.
- `recommend.py` — loads the trained models and turns a predicted impact into
  a manpower / barricading / diversion recommendation. Run it directly for a
  demo on 4 sample events.
- `*.joblib` — trained models and lookup tables (ready to use, already trained
  on the full dataset's train split).

## Key data finding (read this first)
The `priority` field (High/Low) in the raw data is **not a real severity
signal** — it's a deterministic operational tag: every event on a named
corridor is auto-tagged High, every non-corridor event is auto-tagged Low
(5,030/5,049 corridor events = High; 3,122/3,141 non-corridor events = Low).
A classifier trained on it hits 100% accuracy by just memorizing one column —
that's leakage, not a model. So instead this pipeline derives its own
**Impact Severity** label (Low/Medium/High) from the two things that actually
describe real disruption: how long the road stayed disrupted, and whether a
closure was needed. Cut-points are learned only on the training window and
applied forward to the test window, so there's no peeking at the future.

## The 3 models
| Model | Predicts | Test performance |
|---|---|---|
| Impact severity classifier | Low / Medium / High disruption tier | Recall 0.74 on High-impact events (tuned to catch major incidents, at the cost of more false alarms — missing a big one is costlier than over-staffing a small one) |
| Road-closure classifier | P(road closure required) | ROC-AUC 0.81 |
| Clearance-time regressor | Minutes until road reopens | MAE ~5.2 hrs, barely beats a flat median-duration baseline |

**Be honest about the duration model**: clearance time is genuinely hard to
predict from event metadata alone — it depends heavily on how fast a crew
physically reaches the spot, which isn't in this dataset. Treat its output
as a rough planning estimate, not a precise SLA.

Top real drivers of impact severity (no leakage): historical closure-rate of
the event cause, whether the cause is a vehicle breakdown, vehicle type
known/unknown, historical median duration of that cause, and location
(lat/long — i.e. *where* in the city).

## Resource Recommendation Engine
`recommend.py` converts model output into a field plan:
- **Manpower**: base count by impact tier (Low=2, Medium=4, High=8), +2 for
  named corridors, +4 for planned mass-gathering events (rally/procession/VIP/
  protest), +2 if closure is likely.
- **Barricades**: triggered when closure probability ≥ 0.5 or tier is High.
- **Diversion plan**: activates when closure probability ≥ 0.4 or tier is
  High; recommends staffing 2–4 alternate junctions.
- **Deployment duration**: predicted clearance time + 20% buffer.

**This layer is rule-based, not learned — by necessity.** The dataset has no
columns logging how many personnel or barricades were actually used per
event, so there's no ground truth to train a resource-allocation policy
against. The rules above are calibrated against the patterns that *are*
verifiable in the data (corridor designation effect, closure rates by cause).
As the control room starts logging actual deployment counts and outcomes,
swap this rule layer for a trained policy model — that's the natural next
step and the biggest lever for accuracy improvement.

## Post-event learning loop (how to keep this current)
Re-run `train_impact_model.py` periodically (e.g. monthly) as new events get
logged and closed. The historical lookup tables (`cause_hist_closure_rate`,
`cause_hist_median_duration`, `corridor_event_volume`) are exactly the kind of
thing the original problem statement calls "no post-event learning system" —
recomputing them on a schedule *is* the learning system. If/when personnel
and barricade counts start getting logged, add them as labels and replace the
rule-based `recommend()` function with a trained model.

## Usage
```python
from recommend import ResourceRecommender

rec = ResourceRecommender()
plan = rec.recommend(dict(
    event_type="planned", event_cause="public_event", corridor="Mysore Road",
    zone="West Zone 1", veh_type="Unknown", police_station="Rajajinagar",
    latitude=12.96, longitude=77.52, start_datetime="2024-06-20 18:00:00",
))
print(plan)
```
