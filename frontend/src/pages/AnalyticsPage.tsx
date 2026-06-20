export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Historical trends and model performance metrics
        </p>
      </div>
      
      <div className="glass-card p-6 min-h-[400px] flex items-center justify-center">
        <p className="text-slate-500">Analytics charts loading...</p>
      </div>
    </div>
  );
}
