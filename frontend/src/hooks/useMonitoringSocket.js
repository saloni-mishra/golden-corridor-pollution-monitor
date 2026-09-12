import { useEffect, useRef, useState, useCallback } from 'react'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/monitoring'
const MAX_LOGS = 200
const MAX_HISTORY = 120  // per factory

export function useMonitoringSocket() {
  const [connected, setConnected] = useState(false)
  const [factories, setFactories] = useState([])
  const [violations, setViolations] = useState([])
  const [risk, setRisk] = useState(null)
  const [systemState, setSystemState] = useState('MONITORING')
  const [simulationMode, setSimulationMode] = useState('HEALTHY')
  const [agentLogs, setAgentLogs] = useState([])
  const [notice, setNotice] = useState(null)
  const [dispatch, setDispatch] = useState(null)
  const [telemetryHistory, setTelemetryHistory] = useState({})  // {factoryId: [{timestamp, aqi, ...}]}

  const wsRef = useRef(null)
  const reconnectRef = useRef(null)

  const addLog = useCallback((entry) => {
    setAgentLogs(prev => {
      const next = [...prev, entry]
      return next.length > MAX_LOGS ? next.slice(-MAX_LOGS) : next
    })
  }, [])

  const updateTelemetryHistory = useCallback((readings) => {
    setTelemetryHistory(prev => {
      const updated = { ...prev }
      for (const r of readings) {
        const fid = r.factory_id
        const hist = updated[fid] ? [...updated[fid]] : []
        hist.push({
          timestamp: r.timestamp,
          aqi: r.aqi,
          pm25: r.pm25,
          so2: r.so2,
          ph: r.ph,
          cod: r.cod,
        })
        if (hist.length > MAX_HISTORY) hist.splice(0, hist.length - MAX_HISTORY)
        updated[fid] = hist
      }
      return updated
    })
  }, [])

  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState < 2) return

    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      clearTimeout(reconnectRef.current)
    }

    ws.onclose = () => {
      setConnected(false)
      reconnectRef.current = setTimeout(connect, 3000)
    }

    ws.onerror = () => {
      ws.close()
    }

    ws.onmessage = (evt) => {
      let msg
      try { msg = JSON.parse(evt.data) } catch { return }

      switch (msg.type) {
        case 'telemetry_update':
          if (msg.factories?.length) setFactories(msg.factories)
          if (msg.violations !== undefined) setViolations(msg.violations)
          if (msg.risk) setRisk(msg.risk)
          if (msg.system_state) setSystemState(msg.system_state)
          if (msg.simulation_mode) setSimulationMode(msg.simulation_mode)
          if (msg.telemetry) updateTelemetryHistory(msg.telemetry)
          break

        case 'agent_log':
          if (msg.log) addLog(msg.log)
          break

        case 'violation_detected':
          if (msg.violations) setViolations(msg.violations)
          break

        case 'risk_update':
          if (msg.risk) setRisk(msg.risk)
          break

        case 'system_state':
          if (msg.system_state) setSystemState(msg.system_state)
          if (msg.simulation_mode) setSimulationMode(msg.simulation_mode)
          break

        case 'regulatory_notice_ready':
          if (msg.notice) setNotice(msg.notice)
          break

        case 'notification_dispatched':
          if (msg.dispatch) setDispatch(msg.dispatch)
          break

        case 'simulation_started':
          setSimulationMode('CRITICAL_EVENT')
          setNotice(null)
          setDispatch(null)
          break

        case 'simulation_reset':
          setSimulationMode('HEALTHY')
          setViolations([])
          setRisk(null)
          setNotice(null)
          setDispatch(null)
          break

        default:
          break
      }
    }
  }, [addLog, updateTelemetryHistory])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(reconnectRef.current)
      wsRef.current?.close()
    }
  }, [connect])

  return {
    connected,
    factories,
    violations,
    risk,
    systemState,
    simulationMode,
    agentLogs,
    notice,
    dispatch,
    telemetryHistory,
    setNotice,
    setDispatch,
  }
}
