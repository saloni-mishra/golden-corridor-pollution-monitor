import { formatTimestamp, statusColor, riskColor } from '../utils/formatters'

const STATUS_LABELS = { NORMAL: 'Normal', WARNING: 'Warning', BREACH: 'Breach', OFFLINE: 'Offline' }
const STATUS_BADGE = { NORMAL: 'badge-normal', WARNING: 'badge-warning', BREACH: 'badge-breach', OFFLINE: 'badge-offline' }

function MetricRow({ label, value, unit, threshold, breached }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-[#8b949e] text-xs font-mono">{label}</span>
      <span className={`text-xs font-mono font-semibold ${breached ? 'text-[#ff2d55]' : 'text-[#e6edf3]'}`}>
        {value !== undefined && value !== null ? `${typeof value === 'number' ? value.toFixed(1) : value} ${unit}` : '—'}
        {breached && <span className="ml-1 text-[#ff2d55]">⚠</span>}
      </span>
    </div>
  )
}

export default function FactoryCard({ factory, risk, violations, expanded, onToggle }) {
  const statusKey = factory.status?.toUpperCase() || 'NORMAL'
  const borderColor = statusKey === 'BREACH' ? '#ff2d55' : statusKey === 'WARNING' ? '#ffb700' : '#30363d'
  const breachedParams = new Set((violations || []).map(v => v.parameter?.toLowerCase().split(' ')[0]))

  return (
    <div
      className="glass-panel overflow-hidden transition-all"
      style={{ borderColor, borderWidth: '1px', borderStyle: 'solid' }}
    >
      {/* Header row */}
      <button
        className="w-full text-left p-3 flex items-start justify-between gap-2 hover:bg-white/5 transition-colors"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-label={`Toggle details for ${factory.name}`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: statusColor(factory.status), boxShadow: statusKey === 'BREACH' ? `0 0 8px ${statusColor(factory.status)}` : 'none' }}
            />
            <span className="text-[#e6edf3] text-sm font-semibold truncate">{factory.name}</span>
          </div>
          <div className="text-[#8b949e] text-[11px] font-mono ml-4">{factory.location}</div>
          <div className="text-[#8b949e] text-[11px] ml-4">{factory.industry_type}</div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className={`badge ${STATUS_BADGE[statusKey] || 'badge-normal'}`}>
            {STATUS_LABELS[statusKey] || statusKey}
          </span>
          {risk && (
            <span className="text-[10px] font-mono" style={{ color: riskColor(risk.category) }}>
              Risk: {Math.round(risk.score)}/100
            </span>
          )}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-[#30363d] px-3 pb-3 pt-2 space-y-1">
          <div className="grid grid-cols-2 gap-x-4">
            <MetricRow label="AQI" value={factory.last_updated ? null : null} unit="AQI" breached={breachedParams.has('aqi')} />
            <MetricRow label="Pop. Proximity" value={factory.proximity_to_population} unit="" />
          </div>
          <div className="text-[#8b949e] text-[11px] font-mono mt-1">
            Factory ID: <span className="text-[#00e5ff]">{factory.factory_id}</span>
          </div>
          <div className="text-[#8b949e] text-[11px] font-mono">
            Coords: <span className="text-[#e6edf3]">{factory.lat}°N, {factory.lng}°E</span>
          </div>
          {violations?.length > 0 && (
            <div className="mt-2 space-y-1">
              <div className="text-[#ff2d55] text-[11px] font-semibold uppercase tracking-wide">Active Violations</div>
              {violations.map((v, i) => (
                <div key={i} className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[#8b949e]">{v.parameter}</span>
                  <span style={{ color: v.severity === 'SEVERE' ? '#ff2d55' : v.severity === 'CRITICAL' ? '#ff6b35' : '#ffb700' }}>
                    {v.observed_value} {v.unit} ({v.severity})
                  </span>
                </div>
              ))}
            </div>
          )}
          {risk && (
            <div className="mt-2 text-[11px] font-mono text-[#8b949e] border-t border-[#30363d] pt-2">
              <span style={{ color: riskColor(risk.category) }}>
                {risk.category} risk — {risk.recommended_action}
              </span>
            </div>
          )}
          <div className="text-[#8b949e] text-[10px] font-mono mt-1">
            Updated: {formatTimestamp(factory.last_updated)}
          </div>
        </div>
      )}
    </div>
  )
}
