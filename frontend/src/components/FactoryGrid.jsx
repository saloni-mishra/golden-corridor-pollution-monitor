import { AlertTriangle, CheckCircle, AlertOctagon, Activity } from 'lucide-react'
import { formatTimestamp, statusColor } from '../utils/formatters'

function StatusIcon({ status }) {
  const s = status?.toUpperCase()
  if (s === 'BREACH' || s === 'CRITICAL') return <AlertOctagon size={16} style={{ color: '#ff2244' }} />
  if (s === 'WARNING') return <AlertTriangle size={16} style={{ color: '#ffaa00' }} />
  return <CheckCircle size={16} style={{ color: '#00ff88' }} />
}

function MetricRow({ label, value, unit }) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span style={{ color: '#64748b' }}>{label}</span>
      <span className="font-mono font-semibold" style={{ color: '#e2e8f0' }}>
        {value !== undefined && value !== null ? Number(value).toFixed(1) : '—'} <span style={{ color: '#64748b' }}>{unit}</span>
      </span>
    </div>
  )
}

export function FactoryCard({ factory, telemetry }) {
  const status = factory.current_status
  const color = statusColor(status)

  const latest = telemetry?.[telemetry?.length - 1]

  return (
    <div className="glass-panel p-4 flex flex-col gap-3 hover:border-blue-700 transition-all cursor-default"
      style={{ borderColor: status !== 'NORMAL' ? color + '66' : undefined }}>

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-bold text-sm" style={{ color: '#e2e8f0' }}>{factory.name}</div>
          <div className="text-xs mt-0.5" style={{ color: '#64748b' }}>
            {factory.location?.city} · {factory.industry_type}
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold border"
          style={{ color, borderColor: color + '66', backgroundColor: color + '11' }}>
          <StatusIcon status={status} />
          {status}
        </div>
      </div>

      {/* Live metrics */}
      {latest ? (
        <div className="flex flex-col gap-1.5 border-t border-slate-800 pt-3">
          <MetricRow label="AQI" value={latest.aqi} unit="AQI" />
          <MetricRow label="PM2.5" value={latest.pm25} unit="µg/m³" />
          <MetricRow label="SO₂" value={latest.so2} unit="µg/m³" />
          <MetricRow label="pH" value={latest.ph} unit="pH" />
          <MetricRow label="COD" value={latest.cod} unit="mg/L" />
        </div>
      ) : (
        <div className="text-xs text-center py-2" style={{ color: '#64748b' }}>
          <Activity size={14} className="inline mr-1 animate-spin" />Awaiting telemetry…
        </div>
      )}

      {/* Footer */}
      <div className="text-xs" style={{ color: '#475569' }}>
        Pop. proximity: <span style={{ color: '#94a3b8' }}>{factory.location?.proximity_to_population}</span>
        {latest && (
          <span className="ml-2">· {formatTimestamp(latest.timestamp)}</span>
        )}
      </div>
    </div>
  )
}

export function FactoryGrid({ factories, telemetryHistory }) {
  return (
    <section aria-label="Factory monitoring grid">
      <h2 className="text-sm font-bold mb-3 tracking-widest uppercase" style={{ color: '#64748b' }}>
        Factory Grid — 4 Units
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {factories.map(f => (
          <FactoryCard
            key={f.id}
            factory={f}
            telemetry={telemetryHistory[f.id]}
          />
        ))}
        {factories.length === 0 && (
          <div className="col-span-4 text-center py-8 text-slate-500">
            <Activity size={24} className="inline mr-2 animate-spin" />
            Loading factory data…
          </div>
        )}
      </div>
    </section>
  )
}
