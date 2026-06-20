import { useState, useEffect } from 'react';
import { Cpu, Gauge, RefreshCw } from 'lucide-react';
import { fetchModelMetrics } from '../services/api';
import {
  Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

interface ModelInfo {
  version: string;
  primary_metric: number | null;
  metric_name: string | null;
  trained_at: string | null;
  note?: string;
}

interface PredictionStats {
  total_predictions: number;
  predictions_by_tier: { Low: number; Medium: number; High: number };
  avg_latency_ms: number;
  errors: number;
}

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<{
    models: Record<string, ModelInfo>;
    prediction_stats: PredictionStats;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadMetrics() {
    setLoading(true);
    try {
      const data = await fetchModelMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load metrics:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[var(--border)] border-t-[var(--foreground)] rounded-full animate-spin-slow" />
          <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-widest">Loading Analytics…</p>
        </div>
      </div>
    );
  }

  const modelKeys = Object.keys(metrics?.models || {});
  
  // Format data for chart
  const tierData = [
    { name: 'Low', value: metrics?.prediction_stats.predictions_by_tier.Low ?? 0 },
    { name: 'Medium', value: metrics?.prediction_stats.predictions_by_tier.Medium ?? 0 },
    { name: 'High', value: metrics?.prediction_stats.predictions_by_tier.High ?? 0 },
  ];

  const chartColors = ['#a3a3a3', '#525252', '#171717'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Model Analytics</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
            Machine Learning performance metrics, latency benchmarks, and prediction distributions.
          </p>
        </div>
        <button
          onClick={loadMetrics}
          className="self-start sm:self-auto tp-input px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 hover:border-[var(--ring)] cursor-pointer"
        >
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {/* Prediction Stats KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="tp-card p-5">
          <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Total Predictions</p>
          <p className="text-2xl font-extrabold text-[var(--foreground)] mt-1.5">
            {metrics?.prediction_stats.total_predictions ?? 0}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-[var(--muted-foreground)] font-mono">
            <Cpu size={12} /> online engines
          </div>
        </div>

        <div className="tp-card p-5">
          <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Avg Latency</p>
          <div className="flex items-baseline gap-1 mt-1.5">
            <p className="text-2xl font-extrabold text-[var(--foreground)]">
              {(metrics?.prediction_stats.avg_latency_ms ?? 0).toFixed(1)}
            </p>
            <span className="text-xs text-[var(--muted-foreground)] font-medium">ms</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-green-600 dark:text-green-400 font-mono">
            <Gauge size={12} /> optimized path
          </div>
        </div>

        <div className="tp-card p-5">
          <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Failed Queries</p>
          <p className="text-2xl font-extrabold text-[var(--foreground)] mt-1.5">
            {metrics?.prediction_stats.errors ?? 0}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-[var(--muted-foreground)] font-mono">
            {metrics?.prediction_stats.errors && metrics.prediction_stats.errors > 0 ? (
              <span className="text-[var(--destructive)]">Needs attention</span>
            ) : (
              <span className="text-green-600 dark:text-green-400">Healthy status</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Model versions */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-widest">Active Models</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modelKeys.map((key) => {
              const model = metrics?.models[key];
              if (!model) return null;
              return (
                <div key={key} className="tp-card p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[var(--foreground)] capitalize font-mono">
                      {key.replace('_', ' ')}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)]">
                      v{model.version}
                    </span>
                  </div>
                  {model.primary_metric !== null && (
                    <div>
                      <span className="text-xs text-[var(--muted-foreground)] font-medium block">
                        Metric: {model.metric_name || 'value'}
                      </span>
                      <span className="text-xl font-extrabold text-[var(--foreground)]">
                        {model.primary_metric}
                      </span>
                    </div>
                  )}
                  {model.note && (
                    <p className="text-xs text-[var(--muted-foreground)] leading-relaxed italic">
                      {model.note}
                    </p>
                  )}
                  {model.trained_at && (
                    <p className="text-[10px] text-[var(--muted-foreground)] font-mono">
                      Trained: {new Date(model.trained_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Distribution chart */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-widest">Predictions Distribution</h2>
          <div className="tp-card p-5 flex flex-col items-center justify-center min-h-[300px]">
            {metrics?.prediction_stats.total_predictions === 0 ? (
              <p className="text-xs text-[var(--muted-foreground)]">No predictions executed in this session.</p>
            ) : (
              <div className="w-full h-[250px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tierData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {tierData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => [`${value} incidents`, 'Count']} />
                    <Legend iconSize={8} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
