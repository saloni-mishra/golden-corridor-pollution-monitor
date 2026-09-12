import { riskColor } from '../utils/formatters'

function RiskGauge({ score, category }) {
  const color = riskColor(category)
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference
  const dashOffset = circumference - progress

  return (
    <div className="flex flex-col items-center">
      <svg width="180" height="180" viewBox="0 0 180 180" aria-label={`Risk score: ${score} ${category}`}>
        {/* Track */}
        <circle cx="90" cy="90" r={radius} fill="none" stroke="#1e2d50" strokeWidth="14" />
        {/* Progress */}
        <circle
          cx="90" cy="90" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform="rotate(-90 90 90)"
          style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.5s' }}
        />
        {/* Score */}
        <text x="90" y="82" textAnchor="middle" fill={color}
          fontSize="32" fontWeight="bold" fontFamily="monospace">
          {Math.round(score)}
        </text>
        <text x="90" y="100" textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="monospace">
          / 100
        </text>
        <text x="90" y="118" textAnchor="middle" fill={color}
          fontSize="12" fontWeight="bold" fontFamily="monospace">
          {category}
        </text>
      </svg>
    </div>
  )
}

export function RiskPanel({ risk }) {
  if (!risk) {
    return (
      <div className="glass-panel p-4">
        <h2 className="text-sm font-bold mb-3 tracking-widest uppercase" style={{ color: '#64748b' }}>
          Public Health Risk
        </h2>
        <div className="text-center py-6 text-slate-500 text-sm">No risk data yet</div>
      </div>
    )
  }

  const color = riskColor(risk.category)

  return (
    <div className="glass-panel p-4">
      <h2 className="text-sm font-bold mb-3 tracking-widest uppercase" style={{ color: '#64748b' }}>
        Public Health Risk Assessment
      </h2>
      <div className="flex flex-col items-center gap-4">
        <RiskGauge score={risk.score} category={risk.category} />

        {/* Drivers */}
        {risk.primary_drivers?.length > 0 && (
          <div className="w-full">
            <div className="text-xs font-semibold mb-2" style={{ color: '#94a3b8' }}>
              Primary Risk Drivers
            </div>
            <ul className="space-y-1">
              {risk.primary_drivers.map((d, i) => (
                <li key={i} className="flex items-center gap-2 text-xs">
                  <span style={{ color: '#ff6600' }}>▸</span>
                  <span style={{ color: '#cbd5e1' }}>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommended action */}
        {risk.recommended_action && (
          <div className="w-full border-t border-slate-800 pt-3">
            <div className="text-xs font-semibold mb-1" style={{ color: '#94a3b8' }}>
              Recommended Action
            </div>
            <p className="text-xs" style={{ color }}>{risk.recommended_action}</p>
          </div>
        )}
      </div>
    </div>
  )
}
