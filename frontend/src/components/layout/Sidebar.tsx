import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Activity, Map as MapIcon, BarChart3, Bell, LogOut, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { useSidebar } from '../../hooks/useSidebar';

export default function Sidebar() {
  const { collapsed, setCollapsed } = useSidebar();

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/predict',   icon: Activity,        label: 'Impact Forecast' },
    { to: '/map',       icon: MapIcon,         label: 'Live Map' },
    { to: '/analytics', icon: BarChart3,       label: 'Analytics' },
    { to: '/alerts',    icon: Bell,            label: 'Alerts' },
  ];

  const w = collapsed ? 'w-[68px]' : 'w-64';

  return (
    <aside
      className={`${w} tp-sidebar flex flex-col h-screen fixed top-0 left-0 z-50 transition-all duration-300 ease-in-out overflow-hidden`}
    >
      {/* ── Logo ── */}
      <div
        className={`flex items-center gap-3 px-4 h-16 border-b border-[var(--sidebar-border)] shrink-0 ${collapsed ? 'justify-center' : ''}`}
      >
        <div className="w-7 h-7 rounded-md bg-[var(--primary)] flex items-center justify-center shrink-0">
          <Zap size={14} className="text-[var(--primary-foreground)]" />
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-none overflow-hidden">
            <span className="text-sm font-bold text-[var(--sidebar-foreground)] whitespace-nowrap tracking-tight">
              Traffic Pulse
            </span>
            <span className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-widest mt-0.5">
              Live Grid Monitor
            </span>
          </div>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {!collapsed && (
          <p className="px-3 text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-widest mb-2 mt-1">
            Modules
          </p>
        )}
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius)] text-sm font-medium transition-all duration-150 group relative ${
                collapsed ? 'justify-center' : ''
              } ${
                isActive
                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                  : 'text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  size={17}
                  className={`shrink-0 transition-transform duration-150 ${isActive ? '' : 'group-hover:scale-105'}`}
                />
                {!collapsed && (
                  <span className="whitespace-nowrap truncate">{item.label}</span>
                )}
                {/* Tooltip when collapsed */}
                {collapsed && (
                  <span className="absolute left-full ml-2 px-2 py-1 bg-[var(--popover)] text-[var(--popover-foreground)] text-xs rounded-[var(--radius-sm)] border border-[var(--border)] shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                    {item.label}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Footer ── */}
      <div className="border-t border-[var(--sidebar-border)] p-2 space-y-0.5 shrink-0">
        {/* User row */}
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius)] hover:bg-[var(--sidebar-accent)] transition-colors cursor-pointer group">
            <div className="w-7 h-7 rounded-full bg-[var(--primary)] flex items-center justify-center text-[var(--primary-foreground)] text-xs font-bold shrink-0">
              OP
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-semibold text-[var(--sidebar-foreground)] truncate">Central Operator</p>
              <p className="text-[10px] text-[var(--muted-foreground)] truncate">BTP-9924</p>
            </div>
            <LogOut
              size={13}
              className="text-[var(--muted-foreground)] group-hover:text-[var(--destructive)] transition-colors shrink-0"
            />
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-[var(--radius)] text-sm text-[var(--muted-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)] transition-colors ${collapsed ? 'justify-center' : ''}`}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed
            ? <ChevronRight size={15} />
            : (
              <>
                <ChevronLeft size={15} />
                <span className="text-xs font-medium">Collapse</span>
              </>
            )
          }
        </button>
      </div>
    </aside>
  );
}
