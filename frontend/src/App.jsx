import { useState, useEffect } from 'react'
import { useMonitoringSocket } from './hooks/useMonitoringSocket'
import { api } from './services/api'
import { Header } from './components/Header'
import { FactoryGrid } from './components/FactoryGrid'
import { IndustrialMap } from './components/IndustrialMap'
import { TelemetryCharts } from './components/TelemetryCharts'
import { RiskPanel } from './components/RiskPanel'
import { ViolationPanel } from './components/ViolationPanel'
import { AgentTerminal } from './components/AgentTerminal'
import { ActionPanel } from './components/ActionPanel'
import { LegalNoticeModal } from './components/LegalNoticeModal'

export default function App() {
  const {
    connected,
    factories,
    violations,
    risk,
    systemState,
    simulationMode,
    agentLogs,
    notice: wsNotice,
    dispatch: wsDispatch,
    telemetryHistory,
    setNotice,
    setDispatch,
  } = useMonitoringSocket()

  const [showModal, setShowModal] = useState(false)
  const [localNotice, setLocalNotice] = useState(null)
  const [localDispatch, setLocalDispatch] = useState(null)
  
  // Theme state: dark / light
  const [theme, setTheme] = useState(() => localStorage.getItem('app-theme') || 'dark')

  useEffect(() => {
    localStorage.setItem('app-theme', theme)
    if (theme === 'light') {
      document.documentElement.classList.add('light-mode')
    } else {
      document.documentElement.classList.remove('light-mode')
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
  }

  // Sync WS notice into local state
  useEffect(() => {
    if (wsNotice) {
      setLocalNotice(wsNotice)
      setShowModal(true)
    }
  }, [wsNotice])

  useEffect(() => {
    if (wsDispatch) setLocalDispatch(wsDispatch)
  }, [wsDispatch])

  const handleNotice = (n) => {
    setLocalNotice(n)
    setNotice(n)
    setShowModal(true)
  }

  const handleDispatch = (d) => {
    setLocalDispatch(d)
    setDispatch(d)
    setShowModal(false)
  }

  const handleRegenerate = async () => {
    try {
      const n = await api.generateNotice()
      handleNotice(n)
    } catch (e) {
      console.error('Regenerate failed:', e)
    }
  }

  const handleDispatchFromModal = async () => {
    try {
      const r = await api.dispatchAlert()
      handleDispatch(r)
    } catch (e) {
      console.error('Dispatch failed:', e)
    }
  }

  return (
    <div className="min-h-screen p-3 md:p-4 max-w-[1600px] mx-auto">
      <Header
        connected={connected}
        systemState={systemState}
        simulationMode={simulationMode}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main layout */}
      <div className="space-y-4">
        {/* Factory Grid */}
        <FactoryGrid
          factories={factories}
          telemetryHistory={telemetryHistory}
        />

        {/* Map + Risk side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <IndustrialMap factories={factories} />
          </div>
          <div>
            <RiskPanel risk={risk} />
          </div>
        </div>

        {/* Charts */}
        <TelemetryCharts
          telemetryHistory={telemetryHistory}
          factories={factories}
        />

        {/* Violations + Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <ViolationPanel violations={violations} />
          </div>
          <div>
            <ActionPanel
              simulationMode={simulationMode}
              violations={violations}
              notice={localNotice}
              dispatch={localDispatch}
              onNotice={handleNotice}
              onDispatch={handleDispatch}
            />
          </div>
        </div>

        {/* Agent Terminal */}
        <AgentTerminal logs={agentLogs} />

        {/* Regulatory Notice Banner */}
        {localNotice && !showModal && (
          <div className="glass-panel p-3 flex items-center justify-between">
            <span className="text-sm font-semibold" style={{ color: '#a855f7' }}>
              📋 Regulatory notice ready — {localNotice.notice_id}
            </span>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 rounded text-sm font-bold cursor-pointer"
              style={{
                background: 'rgba(168,85,247,0.15)',
                border: '1px solid rgba(168,85,247,0.4)',
                color: '#a855f7',
              }}
            >
              View Notice
            </button>
          </div>
        )}

        {/* Custom Footer */}
        <footer className="text-center py-4 border-t border-slate-800/40">
          <p className="text-xs font-mono text-slate-500">
            Gujarat Pollution Control Board (GPCB) Automated Escalation System · Gujarat Hackathon 2026
          </p>
          <p className="text-[11px] mt-1 text-slate-600">
            Powered by IBM Granite Agentic Framework & IBM Bob Orchestrator
          </p>
        </footer>
      </div>

      {/* Legal Notice Modal */}
      {showModal && localNotice && (
        <LegalNoticeModal
          notice={localNotice}
          onClose={() => setShowModal(false)}
          onDispatch={handleDispatchFromModal}
          onRegenerate={handleRegenerate}
        />
      )}
    </div>
  )
}