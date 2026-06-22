const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE_URL}/health`);
  if (!res.ok) throw new Error('Network response was not ok');
  return res.json();
}

export async function fetchStats() {
  const res = await fetch(`${API_BASE_URL}/stats/overview`);
  if (!res.ok) throw new Error('Network response was not ok');
  return res.json();
}

export async function predictImpact(data: Record<string, unknown>) {
  const res = await fetch(`${API_BASE_URL}/predict?explain=true`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    // Try to extract the backend's error detail before throwing
    let detail = `Prediction failed (HTTP ${res.status})`;
    try {
      const errBody = await res.json();
      if (errBody?.detail) detail = errBody.detail;
    } catch { /* ignore JSON parse errors */ }
    throw new Error(detail);
  }
  return res.json();
}

export async function fetchAlerts(params?: { severity?: string; is_read?: boolean }) {
  const query = new URLSearchParams();
  if (params?.severity) query.append('severity', params.severity);
  if (params?.is_read !== undefined) query.append('is_read', params.is_read.toString());
  const res = await fetch(`${API_BASE_URL}/alerts?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch alerts');
  return res.json();
}

export async function markAlertRead(alertId: number) {
  const res = await fetch(`${API_BASE_URL}/alerts/${alertId}/read`, {
    method: 'PATCH',
  });
  if (!res.ok) throw new Error('Failed to mark alert as read');
  return res.json();
}

export async function fetchMapIncidents() {
  const res = await fetch(`${API_BASE_URL}/geospatial/incidents`);
  if (!res.ok) throw new Error('Failed to fetch map incidents');
  return res.json();
}

export async function fetchModelMetrics() {
  const res = await fetch(`${API_BASE_URL}/model_metrics`);
  if (!res.ok) throw new Error('Failed to fetch model metrics');
  return res.json();
}
