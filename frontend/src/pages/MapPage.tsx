import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchMapIncidents } from '../services/api';
import { AlertCircle, ShieldAlert, Clock, RefreshCw } from 'lucide-react';

interface MapIncident {
  id: number;
  latitude: number;
  longitude: number;
  event_type: string;
  event_cause: string;
  corridor: string;
  zone: string;
  status: string;
  start_datetime: string | null;
  impact_tier: string | null;
  closure_probability: number | null;
  recommended_manpower: number | null;
}

export default function MapPage() {
  const [incidents, setIncidents] = useState<MapIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTier, setFilterTier] = useState<string>('');

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let active = true;
    async function getMapData() {
      try {
        const data = await fetchMapIncidents();
        if (active) {
          setIncidents(data.incidents || []);
        }
      } catch (err) {
        console.error('Failed to load map data:', err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    Promise.resolve().then(() => {
      if (active) setLoading(true);
    });
    getMapData();

    return () => {
      active = false;
    };
  }, [refreshTrigger]);

  const loadMapData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const filteredIncidents = filterTier
    ? incidents.filter((inc) => inc.impact_tier === filterTier)
    : incidents;

  const getMarkerColor = (tier: string | null) => {
    switch (tier) {
      case 'High':
        return '#e7000b'; // Red
      case 'Medium':
        return '#f59e0b'; // Amber
      default:
        return '#6b7280'; // Gray
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4 min-h-[85vh]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Live Grid Monitor</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
            Geospatial overview of active congestions, predictions, and field deployments.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <select
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value)}
            className="tp-input px-3 py-1.5 text-xs font-semibold cursor-pointer"
          >
            <option value="">All Severity</option>
            <option value="High">High Impact</option>
            <option value="Medium">Medium Impact</option>
            <option value="Low">Low Impact</option>
          </select>
          <button
            onClick={loadMapData}
            className="tp-input px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 hover:border-[var(--ring)] cursor-pointer"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Map display */}
      <div className="flex-1 tp-card overflow-hidden relative min-h-[500px] rounded-[var(--radius)]">
        {loading && (
          <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-[var(--background)]/80 backdrop-blur-xs">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-[var(--border)] border-t-[var(--foreground)] rounded-full animate-spin" />
              <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-widest">Loading Live Grid…</p>
            </div>
          </div>
        )}

        <MapContainer
          center={[12.9716, 77.5946]}
          zoom={12}
          style={{ width: '100%', height: '100%', minHeight: '500px', background: '#fafafa' }}
          className="z-10"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />

          {filteredIncidents.map((inc) => (
            <CircleMarker
              key={inc.id}
              center={[inc.latitude, inc.longitude]}
              radius={inc.impact_tier === 'High' ? 12 : inc.impact_tier === 'Medium' ? 9 : 7}
              fillColor={getMarkerColor(inc.impact_tier)}
              color="#ffffff"
              weight={1.5}
              fillOpacity={0.8}
            >
              <Popup>
                <div className="p-1 space-y-2 font-sans text-xs">
                  <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-1.5">
                    <span className="font-bold text-gray-900 font-mono">Incident #{inc.id}</span>
                    <span
                      className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider text-white"
                      style={{ backgroundColor: getMarkerColor(inc.impact_tier) }}
                    >
                      {inc.impact_tier || 'Low'}
                    </span>
                  </div>
                  <p className="font-medium text-gray-800">
                    <span className="capitalize">{inc.event_cause.replace('_', ' ')}</span>
                  </p>
                  <div className="space-y-1 text-gray-500 text-[10px]">
                    <p className="flex items-center gap-1">
                      <AlertCircle size={10} /> {inc.corridor}
                    </p>
                    {inc.closure_probability !== null && (
                      <p className="flex items-center gap-1">
                        <ShieldAlert size={10} /> Closure Risk: {(inc.closure_probability * 100).toFixed(0)}%
                      </p>
                    )}
                    {inc.recommended_manpower !== null && (
                      <p className="flex items-center gap-1">
                        <Clock size={10} /> Dispatch: {inc.recommended_manpower} personnel
                      </p>
                    )}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
