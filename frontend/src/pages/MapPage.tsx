export default function MapPage() {
  return (
    <div className="h-full flex flex-col space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Live Map</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Geospatial visualization of active incidents and congestion
        </p>
      </div>
      
      <div className="flex-1 glass-card overflow-hidden relative">
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800/50">
          <p className="text-slate-500">Leaflet map loading...</p>
        </div>
      </div>
    </div>
  );
}
