import { useTheme } from '../../hooks/useTheme';
import { Sun, Moon, Bell, Search, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-20 border-b border-white/10 dark:border-slate-800/50 bg-white/60 dark:bg-[#050b14]/60 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-40 transition-all duration-300">
      
      {/* Search Bar */}
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-500 transition-colors">
            <Search size={18} />
          </div>
          <input 
            type="text" 
            placeholder="Search intersections, incidents, or dispatch units..." 
            className="w-full bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-full py-2.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all placeholder:text-slate-400 text-sm font-medium"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 ml-8">
        <div className="hidden md:flex items-center gap-2 mr-4 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 tracking-wide">LIVE DATA SYNC</span>
        </div>

        <button
          onClick={toggleTheme}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-all hover:scale-105 active:scale-95 border border-transparent hover:border-slate-300 dark:hover:border-slate-700"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} className="hover:text-amber-400 transition-colors" /> : <Moon size={18} className="hover:text-indigo-600 transition-colors" />}
        </button>

        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-all hover:scale-105 active:scale-95 border border-transparent hover:border-slate-300 dark:hover:border-slate-700">
          <Settings size={18} />
        </button>

        <Link
          to="/alerts"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-500/20 transition-all hover:scale-105 active:scale-95 border border-brand-200 dark:border-brand-500/30 relative shadow-[0_0_15px_rgba(99,102,241,0.15)]"
        >
          <Bell size={18} className="animate-[wiggle_2s_ease-in-out_infinite]" />
          <span className="absolute top-0 right-0 w-3 h-3 bg-rose-500 rounded-full border-2 border-white dark:border-[#050b14] shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
        </Link>
      </div>
    </header>
  );
}
