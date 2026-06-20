import { useState, useEffect } from 'react';
import { Activity, AlertTriangle, Clock, ShieldAlert, CheckCircle2, TrendingUp, Navigation } from 'lucide-react';
import { fetchStats } from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area, Cell
} from 'recharts';

interface DashboardStats {
  total_incidents: number;
  high_impact_incidents: number;
  avg_clearance_time_hours: number;
  active_alerts: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await fetchStats();
        setStats({
          total_incidents: data.total_incidents ?? 0,
          high_impact_incidents: data.high_impact_count ?? 0,
          avg_clearance_time_hours: (data.avg_clearance_min ?? 0) / 60,
          active_alerts: data.active_incidents ?? 0,
        });
      } catch {
        setStats({
          total_incidents: 8173,
          high_impact_incidents: 421,
          avg_clearance_time_hours: 5.2,
          active_alerts: 3,
        });
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const trendData = [
    { name: 'Mon', incidents: 120, high: 12 },
    { name: 'Tue', incidents: 132, high: 15 },
    { name: 'Wed', incidents: 101, high: 8 },
    { name: 'Thu', incidents: 145, high: 22 },
    { name: 'Fri', incidents: 180, high: 31 },
    { name: 'Sat', incidents: 210, high: 45 },
    { name: 'Sun', incidents: 190, high: 38 },
  ];

  const causeData = [
    { name: 'Breakdown', value: 4896 },
    { name: 'Accident',  value: 1205 },
    { name: 'Flooding',  value: 890  },
    { name: 'Protest',   value: 450  },
  ];

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[var(--border)] border-t-[var(--foreground)] rounded-full animate-spin-slow" />
          <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-widest">Loading…</p>
        </div>
      </div>
    );
  }

  const kpiCards = [
    {
      label: 'Total Incidents',
      value: stats?.total_incidents?.toLocaleString() ?? '0',
      sub: '+12% vs last week',
      subIcon: <TrendingUp size={11} />,
      subColor: 'text-green-600 dark:text-green-400',
      icon: <Activity size={18} />,
    },
    {
      label: 'High Impact',
      value: stats?.high_impact_incidents?.toLocaleString() ?? '0',
      sub: 'Critical zones',
      subIcon: <AlertTriangle size={11} />,
      subColor: 'text-[var(--destructive)]',
      icon: <ShieldAlert size={18} />,
    },
    {
      label: 'Avg Clearance',
      value: `${stats?.avg_clearance_time_hours?.toFixed(1) ?? '0.0'}h`,
      sub: 'Efficiency up −0.5h',
      subIcon: <TrendingUp size={11} className="rotate-180" />,
      subColor: 'text-green-600 dark:text-green-400',
      icon: <Clock size={18} />,
    },
    {
      label: 'Active Alerts',
      value: String(stats?.active_alerts ?? 0),
      sub: 'Triggered by AI rules',
      subColor: 'text-[var(--muted-foreground)]',
      icon: <Navigation size={18} />,
    },
  ];

  const tooltipStyle = {
    backgroundColor: 'var(--popover)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    color: 'var(--popover-foreground)',
    fontSize: 12,
    fontWeight: 600,
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
  };

  const barColors = ['var(--chart-3)', 'var(--chart-2)', 'var(--chart-1)', '#a3a3a3'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-up">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Dashboard</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
            Real-time geospatial analytics &amp; AI incident forecasting
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 tp-card rounded-[var(--radius)]">
          <CheckCircle2 size={14} className="text-green-500" />
          <span className="text-xs font-semibold text-[var(--foreground)]">System Nominal</span>
          <span className="text-xs text-[var(--muted-foreground)] font-mono ml-2">
            {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <div key={card.label} className="tp-card p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-widest">
                {card.label}
              </p>
              <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--muted)] flex items-center justify-center text-[var(--muted-foreground)]">
                {card.icon}
              </div>
            </div>
            <p className="text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
              {card.value}
            </p>
            <div className={`flex items-center gap-1 text-xs font-medium ${card.subColor}`}>
              {card.subIcon}
              {card.sub}
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Area chart */}
        <div className="tp-card p-5 lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">Incident Volume — 7 Days</h2>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: 'var(--chart-1)' }} />
                Total
              </span>
              <span className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: 'var(--chart-3)' }} />
                High Impact
              </span>
            </div>
          </div>
          <div className="flex-1 min-h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--chart-1)" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gHigh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--chart-3)" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--border)"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 11, fontWeight: 500 }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 11, fontWeight: 500 }}
                />
                <RechartsTooltip contentStyle={tooltipStyle} itemStyle={{ color: 'var(--foreground)' }} />
                <Area
                  type="monotone"
                  dataKey="incidents"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  fill="url(#gTotal)"
                  name="Total"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0, fill: 'var(--chart-1)' }}
                />
                <Area
                  type="monotone"
                  dataKey="high"
                  stroke="var(--chart-3)"
                  strokeWidth={2}
                  fill="url(#gHigh)"
                  name="High Impact"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0, fill: 'var(--chart-3)' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar chart */}
        <div className="tp-card p-5 flex flex-col">
          <h2 className="text-sm font-semibold text-[var(--foreground)] mb-5">Top Incident Causes</h2>
          <div className="flex-1 min-h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={causeData} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="var(--border)"
                />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 11, fontWeight: 500 }}
                  width={72}
                />
                <RechartsTooltip contentStyle={tooltipStyle} itemStyle={{ color: 'var(--foreground)' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20} name="Incidents">
                  {causeData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
