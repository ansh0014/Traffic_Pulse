export default function AlertsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Alerts</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
          System notifications for high-impact events and critical thresholds
        </p>
      </div>
      <div className="tp-card p-6 min-h-[400px] flex items-center justify-center">
        <p className="text-sm text-[var(--muted-foreground)]">Alerts loading…</p>
      </div>
    </div>
  );
}
