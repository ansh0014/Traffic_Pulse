import { useState } from 'react';
import { predictImpact } from '../services/api';
import { ShieldAlert, BarChart3, Crosshair, Zap, Navigation, Clock, Activity } from 'lucide-react';

export default function PredictPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    latitude: 12.9716,
    longitude: 77.5946,
    event_cause: 'vehicle_breakdown',
    start_datetime: new Date().toISOString().slice(0, 16),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = { ...formData, start_datetime: new Date(formData.start_datetime).toISOString() };
      const res = await predictImpact(payload);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to generate prediction');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'tp-input w-full px-3 py-2.5 text-sm';
  const labelClass = 'block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-widest mb-1.5';

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-up">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)] flex items-center gap-2">
          Impact Forecast
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--muted)] text-[var(--muted-foreground)] border border-[var(--border)]">AI</span>
        </h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
          Analyze real-time grid conditions and generate precise resource constraints.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Form ── */}
        <div className="lg:col-span-4">
          <div className="tp-card p-5">
            <h2 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2 mb-5">
              <Crosshair size={15} className="text-[var(--muted-foreground)]" />
              Incident Parameters
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelClass}>Date &amp; Time</label>
                <input
                  type="datetime-local"
                  name="start_datetime"
                  value={formData.start_datetime}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Event Type</label>
                <select
                  name="event_cause"
                  value={formData.event_cause}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="vehicle_breakdown">Vehicle Breakdown</option>
                  <option value="accident">Major Accident</option>
                  <option value="water_logging">Water Logging</option>
                  <option value="protest">Protest / Rally</option>
                  <option value="construction">Road Construction</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Latitude</label>
                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Longitude</label>
                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="tp-btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[var(--primary-foreground)]/30 border-t-[var(--primary-foreground)] rounded-full animate-spin-slow" />
                    Processing…
                  </>
                ) : (
                  <>
                    <Zap size={15} />
                    Run Analysis
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* ── Results ── */}
        <div className="lg:col-span-8 space-y-4">
          {error && (
            <div className="tp-card p-4 flex items-center gap-3 border-[var(--destructive)]/40 bg-[var(--destructive)]/5">
              <ShieldAlert size={16} className="text-[var(--destructive)] shrink-0" />
              <p className="text-sm text-[var(--destructive)] font-medium">{error}</p>
            </div>
          )}

          {!result && !loading && !error && (
            <div className="tp-card min-h-[420px] flex flex-col items-center justify-center text-center p-8 border-dashed">
              <div className="w-16 h-16 mb-5 rounded-full bg-[var(--muted)] flex items-center justify-center">
                <BarChart3 size={28} className="text-[var(--muted-foreground)]" />
              </div>
              <h3 className="text-base font-semibold text-[var(--foreground)] mb-1">Awaiting Input</h3>
              <p className="text-sm text-[var(--muted-foreground)] max-w-sm leading-relaxed">
                Configure incident parameters and run the analysis to see AI-generated forecasts and resource recommendations.
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-4 animate-fade-up">

              {/* Primary metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Severity */}
                <div className="tp-card p-5">
                  <p className={labelClass}>Impact Severity</p>
                  <p className={`text-3xl font-extrabold tracking-tight mt-1 ${
                    result.prediction.impact_severity === 'High'   ? 'text-[var(--destructive)]' :
                    result.prediction.impact_severity === 'Medium' ? 'text-amber-500'            : 'text-green-600 dark:text-green-400'
                  }`}>
                    {result.prediction.impact_severity}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-2 font-mono">
                    Conf: {(result.prediction.severity_probability * 100).toFixed(1)}%
                  </p>
                </div>

                {/* Clearance */}
                <div className="tp-card p-5">
                  <p className={labelClass}>Est. Clearance</p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <p className="text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
                      {result.prediction.clearance_time_hours.toFixed(1)}
                    </p>
                    <span className="text-sm font-semibold text-[var(--muted-foreground)]">hrs</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-[var(--muted-foreground)]">
                    <Clock size={12} /> predicted duration
                  </div>
                </div>

                {/* Closure risk */}
                <div className="tp-card p-5">
                  <p className={labelClass}>Closure Risk</p>
                  <p className={`text-3xl font-extrabold tracking-tight mt-1 ${result.prediction.road_closure_probability > 0.5 ? 'text-[var(--destructive)]' : 'text-[var(--foreground)]'}`}>
                    {(result.prediction.road_closure_probability * 100).toFixed(0)}%
                  </p>
                  <div className="w-full h-1 bg-[var(--muted)] rounded-full mt-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${result.prediction.road_closure_probability > 0.5 ? 'bg-[var(--destructive)]' : 'bg-[var(--chart-3)]'}`}
                      style={{ width: `${result.prediction.road_closure_probability * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Plan */}
              <div className="tp-card p-5">
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                  <ShieldAlert size={15} className="text-[var(--muted-foreground)]" />
                  Action Plan
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Personnel */}
                  <div className="tp-muted p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-[var(--radius-sm)] bg-[var(--background)] border border-[var(--border)] flex items-center justify-center text-[var(--muted-foreground)]">
                      <Activity size={16} />
                    </div>
                    <div>
                      <p className="text-xs text-[var(--muted-foreground)] font-medium">Dispatch</p>
                      <p className="text-xl font-bold text-[var(--foreground)]">
                        {result.recommendation.recommended_personnel} units
                      </p>
                    </div>
                  </div>

                  {/* Diversion */}
                  <div className="tp-muted p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-[var(--radius-sm)] bg-[var(--background)] border border-[var(--border)] flex items-center justify-center text-[var(--muted-foreground)]">
                        <Navigation size={16} />
                      </div>
                      <div>
                        <p className="text-xs text-[var(--muted-foreground)] font-medium">Traffic Diversion</p>
                        <p className="text-xs text-[var(--muted-foreground)]">Route alternatives</p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded border ${result.recommendation.diversions_required ? 'severity-high' : 'bg-[var(--muted)] text-[var(--muted-foreground)] border-[var(--border)]'}`}>
                      {result.recommendation.diversions_required ? 'Required' : 'Standby'}
                    </span>
                  </div>
                </div>
              </div>

              {/* SHAP */}
              {result.explanation?.top_features && (
                <div className="tp-card p-5">
                  <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-widest mb-4 pb-3 border-b border-[var(--border)]">
                    AI Decision Factors (SHAP)
                  </h3>
                  <div className="space-y-4">
                    {result.explanation.top_features.map((f: any, i: number) => (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-medium text-[var(--foreground)] font-mono">{f.feature}</span>
                          <span className={`text-xs font-bold font-mono ${f.value > 0 ? 'text-[var(--destructive)]' : 'text-green-600 dark:text-green-400'}`}>
                            {f.value > 0 ? '+' : ''}{f.value.toFixed(3)}
                          </span>
                        </div>
                        <div className="w-full h-1 bg-[var(--muted)] rounded-full overflow-hidden flex">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${f.value > 0 ? 'bg-[var(--destructive)]' : 'bg-[var(--chart-3)]'}`}
                            style={{
                              width: `${Math.min(Math.abs(f.value) * 100, 100)}%`,
                              marginLeft: f.value > 0 ? '50%' : `${50 - Math.min(Math.abs(f.value) * 100, 50)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
