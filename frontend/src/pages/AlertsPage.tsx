export default function AlertsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Alerts</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          System notifications for high-impact events and critical thresholds
        </p>
      </div>
      
      <div className="glass-card p-6 min-h-[400px] flex items-center justify-center">
        <p className="text-slate-500">Alerts loading...</p>
      </div>
    </div>
  );
}
