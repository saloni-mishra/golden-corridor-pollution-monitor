import { severityColor, formatTimestamp } from '../utils/formatters'
import { AlertOctagon, AlertTriangle, Info } from 'lucide-react'

function SevIcon({ sev }) {
  const s = sev?.toUpperCase()
  if (s === 'SEVERE') return <AlertOctagon size={13} style={{ color: '#ff2244' }} />
  if (s === 'CRITICAL') return <AlertTriangle size={13} style={{ color: '#ff6600' }} />
  return <Info size={13} style={{ color: '#ffaa00' }} />
}

export function ViolationPanel({ violations }) {
  const sorted = [...(violations || [])].reverse()

  return (
    <div className="glass-panel p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold tracking-widest uppercase" style={{ color: '#64748b' }}>
          Active Violations
        </h2>
        {violations?.length > 0 && (
          <span className="px-2 py-0.5 rounded text-xs font-bold badge-severe">
            {violations.length} ACTIVE
          </span>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-6 text-slate-500 text-sm">
          ✓ No violations — all parameters within range
        </div>
      ) : (
        <div className="overflow-auto max-h-64">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left py-1.5 px-2 font-semibold" style={{ color: '#475569' }}>Factory</th>
                <th className="text-left py-1.5 px-2 font-semibold" style={{ color: '#475569' }}>Parameter</th>
                <th className="text-right py-1.5 px-2 font-semibold" style={{ color: '#475569' }}>Observed</th>
                <th className="text-right py-1.5 px-2 font-semibold" style={{ color: '#475569' }}>Threshold</th>
                <th className="text-left py-1.5 px-2 font-semibold" style={{ color: '#475569' }}>Severity</th>
                <th className="text-left py-1.5 px-2 font-semibold" style={{ color: '#475569' }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((v, i) => {
                const color = severityColor(v.severity)
                return (
                  <tr key={i} className="border-b border-slate-900 hover:bg-slate-900 transition-colors">
                    <td className="py-1.5 px-2 font-mono" style={{ color: '#94a3b8' }}>{v.factory_id}</td>
                    <td className="py-1.5 px-2" style={{ color: '#e2e8f0' }}>{v.parameter}</td>
                    <td className="py-1.5 px-2 text-right font-mono" style={{ color }}>
                      {Number(v.observed_value).toFixed(1)}
                    </td>
                    <td className="py-1.5 px-2 text-right font-mono" style={{ color: '#64748b' }}>
                      {Number(v.threshold).toFixed(0)} {v.unit}
                    </td>
                    <td className="py-1.5 px-2">
                      <span className="flex items-center gap-1">
                        <SevIcon sev={v.severity} />
                        <span style={{ color }}>{v.severity}</span>
                      </span>
                    </td>
                    <td className="py-1.5 px-2 font-mono" style={{ color: '#475569' }}>
                      {formatTimestamp(v.timestamp)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
