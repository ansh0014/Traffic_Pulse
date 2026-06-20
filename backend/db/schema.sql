
-- ── Incidents ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS incidents (
    id               SERIAL PRIMARY KEY,
    event_type       VARCHAR(20)  NOT NULL,                     
    event_cause      VARCHAR(50)  NOT NULL,                     
    corridor         VARCHAR(100) NOT NULL DEFAULT 'Non-corridor',
    zone             VARCHAR(50)  NOT NULL DEFAULT 'Unknown',
    veh_type         VARCHAR(50)  NOT NULL DEFAULT 'Unknown',
    police_station   VARCHAR(100) NOT NULL DEFAULT 'Unknown',
    latitude         DOUBLE PRECISION NOT NULL DEFAULT 12.97,
    longitude        DOUBLE PRECISION NOT NULL DEFAULT 77.59,
    start_datetime   TIMESTAMP WITH TIME ZONE NOT NULL,
    status           VARCHAR(20)  NOT NULL DEFAULT 'active',   
    address          TEXT,
    created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incidents_status       ON incidents (status);
CREATE INDEX IF NOT EXISTS idx_incidents_start_dt     ON incidents (start_datetime DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_zone         ON incidents (zone);


CREATE TABLE IF NOT EXISTS predictions (
    id                       SERIAL PRIMARY KEY,
    incident_id              INTEGER NOT NULL REFERENCES incidents (id) ON DELETE CASCADE,

    impact_tier              VARCHAR(10) NOT NULL,              -- Low / Medium / High
    impact_low_prob          DOUBLE PRECISION NOT NULL DEFAULT 0,
    impact_medium_prob       DOUBLE PRECISION NOT NULL DEFAULT 0,
    impact_high_prob         DOUBLE PRECISION NOT NULL DEFAULT 0,

    -- Road closure
    closure_probability      DOUBLE PRECISION NOT NULL DEFAULT 0,

    -- Clearance
    expected_clearance_min   DOUBLE PRECISION NOT NULL DEFAULT 0,

    -- Resource recommendations
    recommended_manpower     INTEGER NOT NULL DEFAULT 0,
    recommended_barricades   INTEGER NOT NULL DEFAULT 0,
    activate_diversion       BOOLEAN NOT NULL DEFAULT FALSE,
    diversion_points         INTEGER NOT NULL DEFAULT 0,
    deployment_duration_min  INTEGER NOT NULL DEFAULT 60,
    rationale                TEXT,


    shap_explanation_json    JSONB,

    predicted_at             TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_predictions_incident   ON predictions (incident_id);
CREATE INDEX IF NOT EXISTS idx_predictions_tier       ON predictions (impact_tier);


-- ── Alerts ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alerts (
    id             SERIAL PRIMARY KEY,
    prediction_id  INTEGER NOT NULL REFERENCES predictions (id) ON DELETE CASCADE,
    alert_type     VARCHAR(30) NOT NULL,                        -- high_impact, closure_risk, long_clearance
    severity       VARCHAR(15) NOT NULL,                        -- critical, warning, info
    message        TEXT        NOT NULL,
    is_read        BOOLEAN     NOT NULL DEFAULT FALSE,
    email_sent     BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_prediction  ON alerts (prediction_id);
CREATE INDEX IF NOT EXISTS idx_alerts_is_read     ON alerts (is_read);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at  ON alerts (created_at DESC);


-- ── Model Versions ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS model_versions (
    id              SERIAL PRIMARY KEY,
    model_name      VARCHAR(50)  NOT NULL,                      -- impact_severity, closure, duration
    version         VARCHAR(20)  NOT NULL,
    file_path       VARCHAR(200) NOT NULL,
    primary_metric  DOUBLE PRECISION,
    metric_name     VARCHAR(30),                                -- recall_high, roc_auc, mae
    is_active       BOOLEAN NOT NULL DEFAULT FALSE,
    trained_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_model_versions_name      ON model_versions (model_name);
CREATE INDEX IF NOT EXISTS idx_model_versions_is_active ON model_versions (is_active);
