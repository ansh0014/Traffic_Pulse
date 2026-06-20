import { useState } from 'react';
import { predictImpact } from '../services/api';
import { ShieldAlert, BarChart3, Crosshair, Zap, Navigation, Clock, Activity, Cpu } from 'lucide-react';

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
      const payload = {
        ...formData,
        start_datetime: new Date(formData.start_datetime).toISOString(),
      };
      const res = await predictImpact(payload);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to generate prediction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 relative">
      
      {/* Decorative background effects specific to this page */}
      <div className="absolute top-20 right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] -z-10 pointer-events-none mix-blend-screen hidden dark:block"></div>

      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
          Impact <span className="text-gradient">Forecast</span>
          <Cpu className="text-brand-500" size={28} />
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium text-lg">
          Deploy AI to analyze real-time grid conditions and generate precise resource constraints.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Form */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel p-6 border-t-4 border-t-brand-500 shadow-glow-blue relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-bl-full -mr-8 -mt-8"></div>
            
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800 dark:text-white relative z-10">
              <Crosshair size={20} className="text-brand-500" />
              Incident Parameters
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Temporal Vector</label>
                <input 
                  type="datetime-local" 
                  name="start_datetime"
                  value={formData.start_datetime}
                  onChange={handleChange}
                  className="w-full bg-white/50 dark:bg-[#050b14]/50 border border-slate-200 dark:border-slate-700/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 outline-none transition-all dark:text-white font-mono text-sm shadow-inner"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Event Classifier</label>
                <select 
                  name="event_cause"
                  value={formData.event_cause}
                  onChange={handleChange}
                  className="w-full bg-white/50 dark:bg-[#050b14]/50 border border-slate-200 dark:border-slate-700/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 outline-none transition-all dark:text-white font-medium text-sm shadow-inner appearance-none cursor-pointer"
                >
                  <option value="vehicle_breakdown">Vehicle Breakdown</option>
                  <option value="accident">Major Accident</option>
                  <option value="water_logging">Water Logging</option>
                  <option value="protest">Protest / Rally</option>
                  <option value="construction">Road Construction</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Lat</label>
                  <input 
                    type="number" step="any"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    className="w-full bg-white/50 dark:bg-[#050b14]/50 border border-slate-200 dark:border-slate-700/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-500/50 outline-none dark:text-white font-mono text-sm shadow-inner"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Lng</label>
                  <input 
                    type="number" step="any"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    className="w-full bg-white/50 dark:bg-[#050b14]/50 border border-slate-200 dark:border-slate-700/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-500/50 outline-none dark:text-white font-mono text-sm shadow-inner"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full mt-6 bg-gradient-to-r from-brand-600 to-cyan-500 hover:from-brand-500 hover:to-cyan-400 text-white font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all active:scale-[0.98] flex items-center justify-center gap-2 overflow-hidden relative group"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="relative z-10 tracking-wider">Processing Matrix...</span>
                  </>
                ) : (
                  <>
                    <Zap size={18} className="relative z-10 animate-pulse" />
                    <span className="relative z-10 tracking-wider uppercase">Execute Analysis</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
        
        {/* Right Column: Results */}
        <div className="lg:col-span-8 space-y-6">
          {error && (
            <div className="glass-panel severity-high p-4 flex items-center gap-3 animate-in slide-in-from-top-2">
              <ShieldAlert size={20} className="animate-pulse" />
              <p className="font-medium tracking-wide">{error}</p>
            </div>
          )}

          {!result && !loading && !error && (
            <div className="glass-panel h-full min-h-[500px] flex flex-col items-center justify-center text-slate-500 p-8 text-center border-dashed border-2 border-slate-300 dark:border-slate-700/50 bg-slate-50/50 dark:bg-[#050b14]/30 relative overflow-hidden group">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 mb-6 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center border border-slate-200 dark:border-slate-700/50 group-hover:scale-110 transition-transform duration-700 group-hover:shadow-glow-blue">
                  <BarChart3 size={40} className="text-slate-300 dark:text-slate-600 group-hover:text-brand-500 transition-colors duration-700" />
                </div>
                <h3 className="text-2xl font-bold text-slate-700 dark:text-slate-300 mb-2 tracking-tight">System Standby</h3>
                <p className="max-w-md text-sm leading-relaxed">
                  Input coordinates and incident type into the engine. The Random Forest matrix will compute geospatial impact boundaries and resource allocation constraints.
                </p>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-6 animate-in slide-in-from-right-8 duration-700">
              
              {/* Primary Metrics Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className={`glass-panel p-6 border-t-4 relative overflow-hidden group ${
                  result.prediction.impact_severity === 'High' ? 'border-t-rose-500 shadow-[0_0_30px_rgba(225,29,72,0.1)]' : 
                  result.prediction.impact_severity === 'Medium' ? 'border-t-amber-500 shadow-[0_0_30px_rgba(217,119,6,0.1)]' : 'border-t-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.1)]'
                }`}>
                  <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full -mr-4 -mt-4 opacity-10 ${
                    result.prediction.impact_severity === 'High' ? 'bg-rose-500' : 
                    result.prediction.impact_severity === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}></div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 relative z-10">Calculated Impact</p>
                  <p className={`text-4xl font-extrabold tracking-tight relative z-10 ${
                    result.prediction.impact_severity === 'High' ? 'text-rose-500 drop-shadow-[0_0_8px_rgba(225,29,72,0.4)]' : 
                    result.prediction.impact_severity === 'Medium' ? 'text-amber-500' : 'text-emerald-500'
                  }`}>
                    {result.prediction.impact_severity}
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-400">
                      Conf: {(result.prediction.severity_probability * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="glass-panel p-6 border-t-4 border-t-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.1)] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-bl-full -mr-4 -mt-4 group-hover:scale-125 transition-transform duration-500"></div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 relative z-10">Est. Clearance</p>
                  <div className="flex items-baseline gap-1 relative z-10">
                    <p className="text-4xl font-extrabold tracking-tight text-indigo-500 drop-shadow-[0_0_8px_rgba(99,102,241,0.4)]">
                      {result.prediction.clearance_time_hours.toFixed(1)}
                    </p>
                    <span className="text-sm font-bold text-indigo-500/60 uppercase">hrs</span>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <Clock size={14} className="text-slate-400" />
                    <span className="text-xs font-medium text-slate-500">predicted duration</span>
                  </div>
                </div>

                <div className={`glass-panel p-6 border-t-4 relative overflow-hidden group ${
                  result.prediction.road_closure_probability > 0.5 ? 'border-t-rose-500 shadow-[0_0_30px_rgba(225,29,72,0.1)]' : 'border-t-emerald-500'
                }`}>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Closure Risk</p>
                  <div className="flex items-baseline gap-1">
                    <p className={`text-4xl font-extrabold tracking-tight ${result.prediction.road_closure_probability > 0.5 ? 'text-rose-500 drop-shadow-[0_0_8px_rgba(225,29,72,0.4)]' : 'text-slate-800 dark:text-white'}`}>
                      {(result.prediction.road_closure_probability * 100).toFixed(0)}
                    </p>
                    <span className="text-sm font-bold text-slate-400 uppercase">%</span>
                  </div>
                  
                  {/* Progress bar visual */}
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mt-5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${result.prediction.road_closure_probability > 0.5 ? 'bg-rose-500 shadow-glow-red' : 'bg-emerald-500'}`}
                      style={{ width: `${result.prediction.road_closure_probability * 100}%` }}
                    ></div>
                  </div>
                </div>

              </div>

              {/* Recommendation Engine Output */}
              <div className="glass-panel p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                
                <h3 className="text-xl font-extrabold mb-6 flex items-center gap-3 text-slate-800 dark:text-white">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
                    <ShieldAlert size={18} />
                  </div>
                  Engineered Action Plan
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                  <div className="bg-gradient-to-br from-brand-500/10 to-cyan-500/5 border border-brand-500/20 rounded-2xl p-6 shadow-inner relative overflow-hidden group">
                    <div className="absolute right-0 bottom-0 text-brand-500/10 group-hover:scale-110 transition-transform duration-500">
                      <Activity size={120} className="-mb-8 -mr-8" />
                    </div>
                    <p className="text-xs font-bold text-brand-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
                      Dispatch Protocol
                    </p>
                    <p className="text-slate-700 dark:text-slate-300 text-lg font-medium leading-relaxed mt-4">
                      Deploy <span className="text-3xl font-extrabold text-brand-500 tracking-tight mx-1">{result.recommendation.recommended_personnel}</span> units to coordinate grid lock.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-white/40 dark:bg-[#050b14]/40 border border-slate-200 dark:border-slate-700/50 rounded-xl p-5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                          <Navigation size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-white">Traffic Diversion</p>
                          <p className="text-xs text-slate-500 mt-0.5">Route alternatives required</p>
                        </div>
                      </div>
                      <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${result.recommendation.diversions_required ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                        {result.recommendation.diversions_required ? 'Execute' : 'Standby'}
                      </div>
                    </div>
                    
                    <div className="bg-white/40 dark:bg-[#050b14]/40 border border-slate-200 dark:border-slate-700/50 rounded-xl p-5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                          <ShieldAlert size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-white">Physical Barricades</p>
                          <p className="text-xs text-slate-500 mt-0.5">Perimeter containment</p>
                        </div>
                      </div>
                      <p className="text-2xl font-extrabold text-slate-800 dark:text-white">
                        {result.recommendation.recommended_barricades}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* SHAP Explanations */}
              {result.explanation && result.explanation.top_features && (
                <div className="glass-panel p-8">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
                    AI Decision Matrix (SHAP Values)
                  </h3>
                  <div className="space-y-5">
                    {result.explanation.top_features.map((feature: any, idx: number) => (
                      <div key={idx} className="relative group">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300 font-mono tracking-tight">
                            {feature.feature}
                          </span>
                          <span className={`text-sm font-bold font-mono ${feature.value > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                            {feature.value > 0 ? '+' : ''}{feature.value.toFixed(3)}
                          </span>
                        </div>
                        
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden flex">
                          <div 
                            className={`h-full ${feature.value > 0 ? 'bg-gradient-to-r from-rose-600 to-rose-400 shadow-glow-red' : 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-glow-emerald'} transition-all duration-1000 ease-out`}
                            style={{ 
                              width: `${Math.min(Math.abs(feature.value) * 100, 100)}%`,
                              marginLeft: feature.value > 0 ? '50%' : `${50 - Math.min(Math.abs(feature.value) * 100, 50)}%`
                            }}
                          ></div>
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
