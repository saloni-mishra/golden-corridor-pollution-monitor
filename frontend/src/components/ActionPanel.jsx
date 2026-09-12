import { useState } from 'react'
import { api } from '../services/api'
import { Zap, RefreshCw, FileText, Send, Loader } from 'lucide-react'

export function ActionPanel({ simulationMode, violations, notice, dispatch: dispatchResult, onNotice, onDispatch }) {
  const [loading, setLoading] = useState({})
  const [toast, setToast] = useState(null)

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError })
    setTimeout(() => setToast(null), 5000)
  }

  const run = async (key, fn) => {
    setLoading(l => ({ ...l, [key]: true }))
    try {
      const result = await fn()
      return result
    } catch (e) {
      showToast(e?.detail || e?.message || 'Request failed', true)
    } finally {
      setLoading(l => ({ ...l, [key]: false }))
    }
  }

  const handleTrigger = () => run('trigger', async () => {
    await api.triggerSimulation()
    showToast('Toxic spill simulation triggered — monitoring for threshold breaches')
  })

  const handleReset = () => run('reset', async () => {
    await api.resetSimulation()
    showToast('System reset to healthy baseline')
  })

  const handleGenerate = () => run('generate', async () => {
    const n = await api.generateNotice()
    onNotice?.(n)
    showToast('Regulatory notice generated — review in modal')
  })

  const handleDispatch = () => run('dispatch', async () => {
    const r = await api.dispatchAlert()
    onDispatch?.(r)
    showToast('Regulatory alert dispatched successfully — Email + SMS simulation completed. NOTE: No real email or SMS was sent.')
  })

  const hasViolations = violations?.length > 0
  const hasNotice = !!notice
  const isLoading = key => loading[key]

  return (
    <div className="glass-panel p-4">
      <h2 className="text-sm font-bold mb-4 tracking-widest uppercase" style={{ color: '#64748b' }}>
        Simulation Controls
      </h2>

      {/* Toast */}
      {toast && (
        <div className={`mb-3 p-3 rounded text-xs border ${toast.isError
          ? 'border-red-700 bg-red-950 text-red-300'
          : 'border-green-800 bg-green-950 text-green-300'
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Trigger */}
        <button
          onClick={handleTrigger}
          disabled={isLoading('trigger')}
          aria-label="Simulate toxic spill event"
          className="flex items-center justify-center gap-2 px-4 py-3 rounded font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
          style={{
            background: 'rgba(255,34,68,0.12)',
            border: '1px solid rgba(255,34,68,0.5)',
            color: '#ff2244',
          }}
        >
          {isLoading('trigger') ? <Loader size={16} className="animate-spin" /> : <Zap size={16} />}
          Simulate Toxic Spill / AQI Spike
        </button>

        {/* Reset */}
        <button
          onClick={handleReset}
          disabled={isLoading('reset')}
          aria-label="Reset to healthy baseline"
          className="flex items-center justify-center gap-2 px-4 py-3 rounded font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
          style={{
            background: 'rgba(0,255,136,0.08)',
            border: '1px solid rgba(0,255,136,0.35)',
            color: '#00ff88',
          }}
        >
          {isLoading('reset') ? <Loader size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          Reset to Healthy Baseline
        </button>

        {/* Generate Notice */}
        <button
          onClick={handleGenerate}
          disabled={!hasViolations || isLoading('generate')}
          aria-label="Generate regulatory notice"
          title={!hasViolations ? 'Trigger a simulation first to create violations' : 'Generate Granite regulatory notice'}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'rgba(168,85,247,0.1)',
            border: '1px solid rgba(168,85,247,0.4)',
            color: '#a855f7',
          }}
        >
          {isLoading('generate') ? <Loader size={16} className="animate-spin" /> : <FileText size={16} />}
          Generate Regulatory Notice
        </button>

        {/* Dispatch */}
        <button
          onClick={handleDispatch}
          disabled={!hasNotice || isLoading('dispatch')}
          aria-label="Dispatch regulatory alert"
          title={!hasNotice ? 'Generate a notice first' : 'Dispatch simulated regulatory alert'}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'rgba(59,130,246,0.1)',
            border: '1px solid rgba(59,130,246,0.4)',
            color: '#3b82f6',
          }}
        >
          {isLoading('dispatch') ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
          Dispatch Regulatory Alert
        </button>
      </div>

      {dispatchResult && (
        <div className="mt-3 p-3 rounded border border-blue-800 bg-blue-950 text-xs text-blue-300">
          ✅ {dispatchResult.message}
        </div>
      )}

      <p className="mt-3 text-xs" style={{ color: '#334155' }}>
        ⚠ Simulation only — no real email or SMS is sent. All data is simulated.
      </p>
    </div>
  )
}
