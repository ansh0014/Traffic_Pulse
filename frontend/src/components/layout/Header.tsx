import { useTheme } from '../../hooks/useTheme';
import { Sun, Moon, Bell, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-16 border-b border-[var(--border)] bg-[var(--background)] flex items-center justify-between px-6 sticky top-0 z-40 transition-colors duration-300">

      {/* Search */}
      <div className="flex-1 max-w-sm">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search..."
            className="tp-input w-full pl-9 pr-4 py-2 text-sm"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 ml-4">
        {/* Live indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--muted)] border border-[var(--border)]">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Live</span>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="w-8 h-8 flex items-center justify-center rounded-[var(--radius)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          {theme === 'dark'
            ? <Sun size={16} />
            : <Moon size={16} />
          }
        </button>

        {/* Alerts bell */}
        <Link
          to="/alerts"
          className="w-8 h-8 flex items-center justify-center rounded-[var(--radius)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors relative"
        >
          <Bell size={16} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--destructive)] rounded-full border border-[var(--background)]"></span>
        </Link>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-[var(--primary-foreground)] text-xs font-bold cursor-pointer">
          OP
        </div>
      </div>
    </header>
  );
}
