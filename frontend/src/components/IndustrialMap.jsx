import { statusColor } from '../utils/formatters'

const FACTORY_POSITIONS = {
  'VAPI-A': { x: 120, y: 260 },
  'VAPI-B': { x: 200, y: 220 },
  'ANK-4':  { x: 380, y: 100 },
  'ANK-C':  { x: 460, y: 70  },
}

const FACTORY_LABELS = {
  'VAPI-A': 'VAPI-A',
  'VAPI-B': 'VAPI-B',
  'ANK-4':  'ANK-4',
  'ANK-C':  'ANK-C',
}

export function IndustrialMap({ factories }) {
  const factoryMap = Object.fromEntries((factories || []).map(f => [f.id, f]))

  return (
    <div className="glass-panel p-4">
      <h2 className="text-sm font-bold mb-3 tracking-widest uppercase" style={{ color: '#64748b' }}>
        Industrial Corridor Map — Vapi–Ankleshwar
      </h2>
      <div className="relative w-full" style={{ aspectRatio: '2/1' }}>
        <svg viewBox="0 0 600 320" className="w-full h-full" aria-label="Vapi-Ankleshwar industrial corridor map">
          {/* Background */}
          <rect width="600" height="320" fill="#0a0e1a" rx="6" />

          {/* Corridor road */}
          <path d="M 80 290 Q 200 230 310 160 Q 400 100 520 50"
            stroke="#1e2d50" strokeWidth="12" fill="none" strokeLinecap="round" />
          <path d="M 80 290 Q 200 230 310 160 Q 400 100 520 50"
            stroke="#00d4ff22" strokeWidth="2" fill="none" strokeLinecap="round" strokeDasharray="8 6" />

          {/* Gulf of Khambhat label */}
          <text x="50" y="300" fill="#1e2d50" fontSize="10" fontFamily="monospace">Gulf of Khambhat →</text>

          {/* City labels */}
          <text x="90" y="310" fill="#334155" fontSize="9" fontFamily="monospace">VAPI</text>
          <text x="370" y="310" fill="#334155" fontSize="9" fontFamily="monospace">ANKLESHWAR</text>

          {/* Distance indicator */}
          <line x1="80" y1="295" x2="480" y2="295" stroke="#1e2d50" strokeWidth="1" />
          <text x="260" y="308" fill="#1e3a5f" fontSize="8" fontFamily="monospace" textAnchor="middle">~130 km</text>

          {/* Factory nodes */}
          {Object.entries(FACTORY_POSITIONS).map(([fid, pos]) => {
            const factory = factoryMap[fid]
            const status = factory?.current_status || 'NORMAL'
            const color = statusColor(status)
            const isAlert = status !== 'NORMAL'

            return (
              <g key={fid} role="img" aria-label={`${FACTORY_LABELS[fid]}: ${status}`}>
                {/* Pulse ring (only when alert) */}
                {isAlert && (
                  <circle cx={pos.x} cy={pos.y} r="18" fill="none"
                    stroke={color} strokeWidth="1.5" opacity="0.4">
                    <animate attributeName="r" from="14" to="28" dur="1.8s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.5" to="0" dur="1.8s" repeatCount="indefinite" />
                  </circle>
                )}
                {/* Factory dot */}
                <circle cx={pos.x} cy={pos.y} r="10" fill={color + '22'} stroke={color} strokeWidth="2" />
                <text x={pos.x} y={pos.y + 4} textAnchor="middle" fill={color}
                  fontSize="7" fontFamily="monospace" fontWeight="bold">⬟</text>
                {/* Label */}
                <text x={pos.x} y={pos.y - 16} textAnchor="middle" fill={color}
                  fontSize="8" fontFamily="monospace" fontWeight="bold">
                  {FACTORY_LABELS[fid]}
                </text>
                {/* Status */}
                <text x={pos.x} y={pos.y + 22} textAnchor="middle" fill={color}
                  fontSize="7" fontFamily="monospace">
                  {status}
                </text>
              </g>
            )
          })}

          {/* Legend */}
          <g transform="translate(500, 250)">
            <rect width="90" height="60" fill="#0f1629" stroke="#1e2d50" strokeWidth="1" rx="3" />
            <text x="5" y="14" fill="#475569" fontSize="7" fontFamily="monospace">LEGEND</text>
            {[['#00ff88','NORMAL'], ['#ffaa00','WARNING'], ['#ff6600','CRITICAL'], ['#ff2244','BREACH']].map(([c, l], i) => (
              <g key={l} transform={`translate(5, ${20 + i * 12})`}>
                <circle cx="5" cy="4" r="4" fill={c + '33'} stroke={c} strokeWidth="1" />
                <text x="14" y="7" fill={c} fontSize="7" fontFamily="monospace">{l}</text>
              </g>
            ))}
          </g>
        </svg>
      </div>
      <p className="text-xs mt-2" style={{ color: '#334155' }}>
        ⚠ Stylized schematic — not to geographic scale · Factory positions are approximate
      </p>
    </div>
  )
}
