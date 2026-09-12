import { Wifi, WifiOff, Activity, Clock, Sun, Moon } from 'lucide-react'
import { useState, useEffect } from 'react'

export function Header({ connected, systemState, simulationMode, theme, onToggleTheme }) {
  const [time, setTime] = useState(new Date())
  
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const isAlert = simulationMode === 'CRITICAL_EVENT'

  return (
    <header className="glass-panel p-4 mb-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Title */}
        <div>
          <h1 className="text-xl font-bold tracking-wide header-title" style={{ color: theme === 'light' ? '#0284c7' : '#00d4ff' }}>
            🏭 Golden Corridor Industrial Pollution Monitor
          </h1>
          <p className="text-xs mt-1" style={{ color: theme === 'light' ? '#475569' : '#64748b' }}>
            Vapi–Ankleshwar Smart Industrial Monitoring · Gujarat Hackathon 2026 · IBM Granite + IBM Bob
          </p>
        </div>

        {/* Status indicators */}
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded font-mono text-xs font-semibold border transition-colors cursor-pointer"
            style={{
              backgroundColor: theme === 'light' ? '#e2e8f0' : '#1e293b',
              borderColor: theme === 'light' ? '#cbd5e1' : '#334155',
              color: theme === 'light' ? '#0f172a' : '#f8fafc',
            }}
            title="Toggle Day/Night Mode"
          >
            {theme === 'light' ? <Moon size={13} /> : <Sun size={13} className="text-yellow-400" />}
            <span>{theme === 'light' ? 'Night' : 'Day'}</span>
          </button>

          {/* System Online */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ backgroundColor: '#00ff88' }}
              />
              <span
                className="relative inline-flex rounded-full h-3 w-3"
                style={{ backgroundColor: '#00ff88' }}
              />
            </span>
            <span className="font-mono text-xs font-bold" style={{ color: theme === 'light' ? '#15803d' : '#00ff88' }}>
              ONLINE
            </span>
          </div>

          {/* Simulation state */}
          <div
            className={`flex items-center gap-1 px-3 py-1 rounded font-mono text-xs font-bold border ${
              isAlert
                ? 'animate-blink border-red-500 text-red-400 bg-red-950'
                : theme === 'light'
                ? 'border-green-300 text-green-800 bg-green-100'
                : 'border-green-800 text-green-400 bg-green-950'
            }`}
          >
            <Activity size={12} />
            SIM: {simulationMode}
          </div>

          {/* System phase */}
          <div
            className={`font-mono text-xs px-2 py-1 rounded border ${
              theme === 'light'
                ? 'border-blue-300 text-blue-800 bg-blue-100'
                : 'border-blue-800 text-blue-400 bg-blue-950'
            }`}
          >
            PHASE: {systemState}
          </div>

          {/* WebSocket */}
          <div className="flex items-center gap-1 text-xs font-mono">
            {connected ? (
              <>
                <Wifi size={14} className={theme === 'light' ? 'text-green-700' : 'text-green-400'} />
                <span className={theme === 'light' ? 'text-green-700' : 'text-green-400'}>WS LIVE</span>
              </>
            ) : (
              <>
                <WifiOff size={14} className="text-red-500" />
                <span className="text-red-500 animate-blink">RECONNECTING</span>
              </>
            )}
          </div>

          {/* Clock */}
          <div className="flex items-center gap-1 font-mono text-xs" style={{ color: theme === 'light' ? '#475569' : '#64748b' }}>
            <Clock size={12} />
            {time.toLocaleTimeString('en-IN')}
          </div>
        </div>
      </div>
    </header>
  )
}