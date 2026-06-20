import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Activity, Map as MapIcon, BarChart3, Bell, Shield, LogOut } from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Command Center' },
    { to: '/predict', icon: Activity, label: 'Impact Forecast' },
    { to: '/map', icon: MapIcon, label: 'Live Grid' },
    { to: '/analytics', icon: BarChart3, label: 'Deep Analytics' },
    { to: '/alerts', icon: Bell, label: 'System Alerts' },
  ];

  return (
    <aside className="w-72 bg-[#0a0f1c]/95 backdrop-blur-xl border-r border-slate-800/80 flex flex-col h-screen fixed top-0 left-0 z-50 transition-all duration-300 shadow-2xl">
      <div className="p-8 flex flex-col items-center border-b border-slate-800/50">
        <div className="relative mb-4">
          <div className="absolute inset-0 bg-brand-500 blur-xl opacity-40 rounded-full animate-pulse-slow"></div>
          <div className="w-16 h-16 bg-gradient-to-br from-brand-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg relative z-10 border border-white/10">
            <Shield size={32} className="text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight text-center">
          Grid<span className="text-gradient">Lock</span> <span className="text-sm align-top text-slate-400 font-medium">2.0</span>
        </h1>
        <p className="text-[10px] font-semibold text-slate-500 mt-2 uppercase tracking-[0.2em] flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
          BTP Core System
        </p>
      </div>

      <nav className="flex-1 px-4 py-8 space-y-3 overflow-y-auto">
        <p className="px-4 text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Main Modules</p>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `group relative flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 overflow-hidden ${
                isActive
                  ? 'bg-gradient-to-r from-brand-600/20 to-transparent text-brand-400 border-l-2 border-brand-500'
                  : 'hover:bg-slate-800/40 text-slate-400 hover:text-slate-200 border-l-2 border-transparent'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`absolute inset-0 bg-gradient-to-r from-brand-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'opacity-100' : ''}`}></div>
                <item.icon size={22} className={`relative z-10 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]' : ''}`} />
                <span className="relative z-10 font-medium tracking-wide">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-6 border-t border-slate-800/50 bg-gradient-to-t from-[#050b14] to-transparent">
        <div className="glass-panel border-slate-700/40 bg-slate-800/30 p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-800/50 transition-colors group">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 border border-slate-500 flex items-center justify-center text-sm font-bold text-white shadow-inner relative overflow-hidden">
            <span className="relative z-10">OP</span>
            <div className="absolute inset-0 bg-brand-500 opacity-0 group-hover:opacity-20 transition-opacity"></div>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">Central Operator</p>
            <p className="text-xs text-slate-400">ID: BTP-9924</p>
          </div>
          <LogOut size={16} className="text-slate-500 group-hover:text-rose-400 transition-colors" />
        </div>
      </div>
    </aside>
  );
}
