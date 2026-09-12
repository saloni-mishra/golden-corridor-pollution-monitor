const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = {
  health: () => fetch(`${API_BASE}/api/health`).then(r => r.json()),
  factories: () => fetch(`${API_BASE}/api/factories`).then(r => r.json()),
  telemetry: () => fetch(`${API_BASE}/api/telemetry`).then(r => r.json()),
  violations: () => fetch(`${API_BASE}/api/violations`).then(r => r.json()),
  risk: () => fetch(`${API_BASE}/api/risk`).then(r => r.json()),
  systemState: () => fetch(`${API_BASE}/api/system-state`).then(r => r.json()),
  logs: () => fetch(`${API_BASE}/api/logs`).then(r => r.json()),

  triggerSimulation: () =>
    fetch(`${API_BASE}/api/simulation/trigger`, { method: 'POST' }).then(r => r.json()),

  resetSimulation: () =>
    fetch(`${API_BASE}/api/simulation/reset`, { method: 'POST' }).then(r => r.json()),

  generateNotice: () =>
    fetch(`${API_BASE}/api/regulatory/generate-notice`, { method: 'POST' }).then(r => {
      if (!r.ok) return r.json().then(e => Promise.reject(e))
      return r.json()
    }),

  dispatchAlert: () =>
    fetch(`${API_BASE}/api/regulatory/dispatch`, { method: 'POST' }).then(r => {
      if (!r.ok) return r.json().then(e => Promise.reject(e))
      return r.json()
    }),
}
