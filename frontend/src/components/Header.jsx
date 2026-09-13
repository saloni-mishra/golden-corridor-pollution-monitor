import { Wifi, WifiOff, Activity, Clock, Sun, Moon, ShieldCheck } from 'lucide-react'
import { useState, useEffect } from 'react'

export function Header({ connected, systemState, simulationMode, theme, onToggleTheme }) {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const isAlert = simulationMode === 'CRITICAL_EVENT'

  return (
    <header className="glass-panel px-5 py-3 mb-4 flex flex-wrap items-center justify-between gap-4">
      {/* Title & Organization Subtitle */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-md bg-blue-500/10 text-blue-500 border border-blue-500/20">
          <ShieldCheck size={22} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-tight text-slate-100">
              Golden Corridor Environmental Monitoring System
            </h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              GPCB OCEMS
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Automated Multi-Agent Industrial Compliance Grid · Vapi–Ankleshwar Industrial Corridor
          </p>
        </div>
      </div>

      {/* Telemetry & Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Day / Night Toggle */}
        <button
          onClick={onToggleTheme}
          className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium border transition-colors cursor-pointer border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700"
          title="Toggle Day/Night Mode"
        >
          {theme === 'light' ? <Moon size={13} /> : <Sun size={13} className="text-amber-400" />}
          <span>{theme === 'light' ? 'Night' : 'Day'}</span>
        </button>

        {/* Phase Badge */}
        <div className="text-xs font-mono font-medium px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300">
          STATE: {systemState}
        </div>

        {/* Simulation Mode Badge */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-mono text-xs font-semibold border ${
            isAlert
              ? 'border-red-500/50 text-red-400 bg-red-950/40 animate-pulse'
              : 'border-emerald-500/30 text-emerald-400 bg-emerald-950/20'
          }`}
        >
          <Activity size={12} />
          {isAlert ? 'CRITICAL EVENT' : 'SYSTEM HEALTHY'}
        </div>

        {/* Live WebSocket Connection */}
        <div className="flex items-center gap-1.5 text-xs font-medium pl-1">
          {connected ? (
            <>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-400 font-mono">FEED LIVE</span>
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <span className="text-rose-400 font-mono">RECONNECTING</span>
            </>
          )}
        </div>

        {/* System Time */}
        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 pl-2 border-l border-slate-700">
          <Clock size={12} />
          {time.toLocaleTimeString('en-IN', { hour12: false })}
        </div>
      </div>
    </header>
  )
}