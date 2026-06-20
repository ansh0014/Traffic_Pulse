export default function MapPage() {
  return (
    <div className="h-full flex flex-col space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Live Map</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
          Geospatial visualization of active incidents and congestion
        </p>
      </div>
      <div className="flex-1 tp-card overflow-hidden relative min-h-[400px]">
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--muted)]">
          <p className="text-sm text-[var(--muted-foreground)]">Leaflet map loading…</p>
        </div>
      </div>
    </div>
  );
}
