import { useEffect, useRef } from 'react'
import { formatTimestamp } from '../utils/formatters'

const AGENT_COLORS = {
  'SYSTEM':                  '#00d4ff',
  'MonitoringAgent':         '#00ff88',
  'ComplianceAgent':         '#ffaa00',
  'HealthRiskAgent':         '#ff6600',
  'RegulatoryAgent':         '#ff2244',
  'WatsonxGraniteProvider':  '#a855f7',
  'NotificationService':     '#3b82f6',
  'Orchestrator':            '#64748b',
}

const LEVEL_COLORS = {
  'INFO':    '#475569',
  'WARNING': '#ffaa00',
  'ERROR':   '#ff2244',
  'SUCCESS': '#00ff88',
  'CRITICAL':'#ff6600',
}

export function AgentTerminal({ logs }) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [logs])

  return (
    <div className="glass-panel p-4 flex flex-col" style={{ minHeight: 260 }}>
      <h2 className="text-sm font-bold mb-3 tracking-widest uppercase flex items-center gap-2" style={{ color: '#64748b' }}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
        </span>
        Agent Terminal
        <span className="ml-auto text-xs font-normal" style={{ color: '#334155' }}>{logs.length} entries</span>
      </h2>
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto font-mono text-xs space-y-0.5 pr-1"
        style={{ maxHeight: 280 }}
        role="log"
        aria-live="polite"
        aria-label="Agent event log"
      >
        {logs.length === 0 ? (
          <div style={{ color: '#334155' }} className="py-4 text-center">Waiting for agent events…</div>
        ) : (
          logs.map((entry, i) => {
            const agentColor = entry.color
              ? ('#' + entry.color === entry.color ? entry.color : AGENT_COLORS[entry.agent] || '#64748b')
              : AGENT_COLORS[entry.agent] || '#64748b'
            const levelColor = LEVEL_COLORS[entry.level] || '#475569'
            return (
              <div key={i} className="flex gap-2 leading-relaxed hover:bg-slate-900 px-1 rounded">
                <span style={{ color: '#334155', whiteSpace: 'nowrap' }}>
                  {formatTimestamp(entry.timestamp)}
                </span>
                <span style={{ color: agentColor, minWidth: 120, whiteSpace: 'nowrap' }}>
                  [{entry.agent}]
                </span>
                <span style={{ color: levelColor, minWidth: 50, whiteSpace: 'nowrap' }}>
                  {entry.level}
                </span>
                <span style={{ color: '#94a3b8' }}>{entry.message}</span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}