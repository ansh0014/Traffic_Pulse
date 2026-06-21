import { useState, useEffect } from 'react';
import { ShieldAlert, Bell, Eye, Info, AlertTriangle, RefreshCw } from 'lucide-react';
import { fetchAlerts, markAlertRead } from '../services/api';

interface Alert {
  id: number;
  prediction_id: number;
  alert_type: string;
  severity: string;
  message: string;
  is_read: boolean;
  email_sent: boolean;
  created_at: string;
  event_cause: string | null;
  corridor: string | null;
  impact_tier: string | null;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [readFilter, setReadFilter] = useState<boolean | undefined>(undefined);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let active = true;
    async function getAlerts() {
      try {
        const data = await fetchAlerts({
          severity: severityFilter || undefined,
          is_read: readFilter
        });
        if (active) {
          setAlerts(data.alerts || []);
        }
      } catch (err) {
        console.error('Failed to load alerts:', err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    Promise.resolve().then(() => {
      if (active) setLoading(true);
    });
    getAlerts();

    return () => {
      active = false;
    };
  }, [severityFilter, readFilter, refreshTrigger]);

  const loadAlerts = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await markAlertRead(id);
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a));
    } catch (err) {
      console.error('Failed to mark alert as read:', err);
    }
  };

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/30';
      case 'warning':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/30';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/30';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return <ShieldAlert size={16} className="text-red-600 dark:text-red-400" />;
      case 'warning':
        return <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400" />;
      default:
        return <Info size={16} className="text-blue-600 dark:text-blue-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">System Alerts</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
            Real-time threshold breaches, road closure warnings, and dispatch recommendations.
          </p>
        </div>
        <button
          onClick={loadAlerts}
          className="self-start sm:self-auto tp-input px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 hover:border-[var(--ring)] cursor-pointer"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="tp-input px-3 py-1.5 text-xs cursor-pointer font-medium"
        >
          <option value="">All Severities</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>

        <select
          value={readFilter === undefined ? 'all' : readFilter ? 'read' : 'unread'}
          onChange={(e) => {
            const v = e.target.value;
            setReadFilter(v === 'all' ? undefined : v === 'read');
          }}
          className="tp-input px-3 py-1.5 text-xs cursor-pointer font-medium"
        >
          <option value="all">All Read States</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="tp-card p-6 min-h-[300px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[var(--border)] border-t-[var(--foreground)] rounded-full animate-spin" />
            <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-widest">Loading Alerts…</p>
          </div>
        </div>
      ) : alerts.length === 0 ? (
        <div className="tp-card p-6 min-h-[300px] flex flex-col items-center justify-center text-center">
          <Bell size={24} className="text-[var(--muted-foreground)] mb-3" />
          <h3 className="text-sm font-semibold text-[var(--foreground)]">No alerts found</h3>
          <p className="text-xs text-[var(--muted-foreground)] mt-1 max-w-xs">
            There are no recent alerts matching your current filters.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`tp-card p-5 transition-all duration-200 ${
                alert.is_read ? 'opacity-70' : 'border-[var(--ring)]'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="mt-0.5">{getSeverityIcon(alert.severity)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getSeverityBadgeClass(alert.severity)}`}>
                      {alert.severity}
                    </span>
                    {alert.impact_tier && (
                      <span className="text-[10px] font-semibold text-[var(--muted-foreground)] bg-[var(--muted)] px-2 py-0.5 rounded border border-[var(--border)]">
                        {alert.impact_tier} Impact
                      </span>
                    )}
                    {alert.corridor && (
                      <span className="text-[10px] font-mono text-[var(--muted-foreground)] bg-[var(--muted)] px-2 py-0.5 rounded border border-[var(--border)]">
                        {alert.corridor}
                      </span>
                    )}
                    <span className="text-[10px] text-[var(--muted-foreground)] ml-auto font-mono">
                      {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--foreground)] font-medium leading-relaxed">
                    {alert.message}
                  </p>
                  {alert.event_cause && (
                    <p className="text-xs text-[var(--muted-foreground)] mt-1.5 font-medium">
                      Trigger Event: <span className="text-[var(--foreground)] font-semibold">{alert.event_cause.replace('_', ' ')}</span>
                    </p>
                  )}
                </div>

                {!alert.is_read && (
                  <button
                    onClick={() => handleMarkAsRead(alert.id)}
                    className="self-center p-2 rounded-[var(--radius-sm)] hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
                    title="Mark as Read"
                  >
                    <Eye size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
