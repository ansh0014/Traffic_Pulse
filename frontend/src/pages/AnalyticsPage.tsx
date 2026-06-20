export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Analytics</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
          Historical trends and model performance metrics
        </p>
      </div>
      <div className="tp-card p-6 min-h-[400px] flex items-center justify-center">
        <p className="text-sm text-[var(--muted-foreground)]">Analytics charts loading…</p>
      </div>
    </div>
  );
}
