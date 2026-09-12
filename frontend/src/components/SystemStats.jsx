import { riskColor } from '../utils/formatters'

export default function SystemStats({ factories, violations, risk, simulationMode, systemState }) {
  const breachedCount = (factories || []).filter(f => f.status === 'BREACH' || f.status === 'WARNING').length
  const violCount = (violations || []).length
  const riskEntries = Object.values(risk || {})
  const maxRisk = riskEntries.length ? Math.max(...riskEntries.map(r => r.score || 0)) : 0
  const worstRisk = riskEntries.find(r => r.score === maxRisk)
  const isCritical = simulationMode === 'CRITICAL_EVENT'

  const stats = [
    {
      label: 'Facilities Monitored',
      value: factories?.length || 0,
      sub: `${breachedCount} with active alerts`,
      color: breachedCount > 0 ? '#ff2d55' : '#00ff88',
    },
    {
      label: 'Active Violations',
      value: violCount,
      sub: violCount > 0 ? 'Thresholds breached' : 'All clear',
      color: violCount > 0 ? '#ff6b35' : '#00ff88',
    },
    {
      label: 'Max Health Risk',
      value: maxRisk > 0 ? `${Math.round(maxRisk)}%` : '—',
      sub: worstRisk?.category || 'LOW',
      color: riskColor(worstRisk?.category || 'LOW'),
    },
    {
      label: 'Simulation Mode',
      value: isCritical ? 'CRITICAL' : 'HEALTHY',
      sub: isCritical ? 'Toxic event active' : 'Normal operations',
      color: isCritical ? '#ff2d55' : '#00ff88',
    },
    {
      label: 'System State',
      value: systemState || 'IDLE',
      sub: 'Pipeline status',
      color: systemState === 'ESCALATING' || systemState === 'ALERT_READY' ? '#bf5af2' :
             systemState === 'DISPATCHED' ? '#00e5ff' :
             systemState === 'MONITORING' ? '#00ff88' : '#8b949e',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
      {stats.map((s) => (
        <div key={s.label} className="glass-panel px-3 py-2.5">
          <div className="text-[#8b949e] text-[10px] font-mono uppercase tracking-wide mb-1">{s.label}</div>
          <div className="font-bold text-lg font-mono leading-tight" style={{ color: s.color }}>
            {s.value}
          </div>
          <div className="text-[#8b949e] text-[11px] mt-0.5">{s.sub}</div>
        </div>
      ))}
    </div>
  )
}
