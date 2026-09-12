import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend
} from 'recharts'
import { formatTimestamp } from '../utils/formatters'

const FACTORY_COLORS = {
  'VAPI-A': '#00d4ff',
  'VAPI-B': '#00ff88',
  'ANK-4':  '#ffaa00',
  'ANK-C':  '#ff6600',
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-panel p-2 text-xs font-mono" style={{ minWidth: 120 }}>
      <div style={{ color: '#64748b' }}>{formatTimestamp(label)}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {Number(p.value).toFixed(1)}
        </div>
      ))}
    </div>
  )
}

function buildChartData(telemetryHistory, factoryIds) {
  // Merge all readings from all factories by index/time
  const maxLen = Math.max(...factoryIds.map(fid => (telemetryHistory[fid] || []).length), 0)
  const data = []
  for (let i = 0; i < maxLen; i++) {
    const point = { index: i }
    let ts = null
    for (const fid of factoryIds) {
      const hist = telemetryHistory[fid] || []
      const reading = hist[hist.length - maxLen + i]
      if (reading) {
        ts = reading.timestamp
        point[fid] = reading
      }
    }
    point.timestamp = ts
    data.push(point)
  }
  return data
}

export function TelemetryCharts({ telemetryHistory, factories }) {
  const factoryIds = (factories || []).map(f => f.id)

  // Build per-parameter datasets
  const aqiData = buildChartData(telemetryHistory, factoryIds).map(pt => {
    const row = { ts: pt.timestamp }
    for (const fid of factoryIds) if (pt[fid]) row[fid] = pt[fid].aqi
    return row
  })

  const phData = buildChartData(telemetryHistory, factoryIds).map(pt => {
    const row = { ts: pt.timestamp }
    for (const fid of factoryIds) if (pt[fid]) row[fid] = pt[fid].ph
    return row
  })

  const hasData = aqiData.some(d => factoryIds.some(fid => d[fid] !== undefined))

  if (!hasData) {
    return (
      <div className="glass-panel p-4">
        <h2 className="text-sm font-bold mb-3 tracking-widest uppercase" style={{ color: '#64748b' }}>
          Telemetry Charts
        </h2>
        <div className="text-center py-8 text-slate-500 text-sm">
          Awaiting telemetry data…
        </div>
      </div>
    )
  }

  const chartProps = {
    margin: { top: 5, right: 10, left: -10, bottom: 5 },
  }

  return (
    <div className="glass-panel p-4">
      <h2 className="text-sm font-bold mb-4 tracking-widest uppercase" style={{ color: '#64748b' }}>
        Live Telemetry Charts
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* AQI Chart */}
        <div>
          <div className="text-xs font-semibold mb-2" style={{ color: '#94a3b8' }}>
            Air Quality Index (AQI)
            <span className="ml-2 text-xs" style={{ color: '#334155' }}>
              — Warn: 100 · Crit: 200 · Severe: 300
            </span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={aqiData} {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d5055" />
              <XAxis dataKey="ts" tickFormatter={formatTimestamp} tick={{ fontSize: 9, fill: '#475569' }} />
              <YAxis tick={{ fontSize: 9, fill: '#475569' }} domain={[0, 420]} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={100} stroke="#ffaa0066" strokeDasharray="4 3" label={{ value: 'WARN', fill: '#ffaa00', fontSize: 9 }} />
              <ReferenceLine y={200} stroke="#ff660066" strokeDasharray="4 3" label={{ value: 'CRIT', fill: '#ff6600', fontSize: 9 }} />
              <ReferenceLine y={300} stroke="#ff224466" strokeDasharray="4 3" label={{ value: 'SEV', fill: '#ff2244', fontSize: 9 }} />
              {factoryIds.map(fid => (
                <Line key={fid} type="monotone" dataKey={fid} name={fid}
                  stroke={FACTORY_COLORS[fid]} dot={false} strokeWidth={1.5}
                  isAnimationActive={false} connectNulls />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* pH Chart */}
        <div>
          <div className="text-xs font-semibold mb-2" style={{ color: '#94a3b8' }}>
            Effluent pH
            <span className="ml-2 text-xs" style={{ color: '#334155' }}>
              — Safe: 6.5–8.5 pH
            </span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={phData} {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d5055" />
              <XAxis dataKey="ts" tickFormatter={formatTimestamp} tick={{ fontSize: 9, fill: '#475569' }} />
              <YAxis tick={{ fontSize: 9, fill: '#475569' }} domain={[0, 14]} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={6.5} stroke="#ffaa0066" strokeDasharray="4 3" label={{ value: '6.5', fill: '#ffaa00', fontSize: 9 }} />
              <ReferenceLine y={8.5} stroke="#ffaa0066" strokeDasharray="4 3" label={{ value: '8.5', fill: '#ffaa00', fontSize: 9 }} />
              <ReferenceLine y={5.5} stroke="#ff224466" strokeDasharray="4 3" label={{ value: '5.5', fill: '#ff2244', fontSize: 9 }} />
              {factoryIds.map(fid => (
                <Line key={fid} type="monotone" dataKey={fid} name={fid}
                  stroke={FACTORY_COLORS[fid]} dot={false} strokeWidth={1.5}
                  isAnimationActive={false} connectNulls />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3">
        {factoryIds.map(fid => (
          <div key={fid} className="flex items-center gap-1.5 text-xs font-mono">
            <div className="w-4 h-0.5" style={{ backgroundColor: FACTORY_COLORS[fid] }} />
            <span style={{ color: FACTORY_COLORS[fid] }}>{fid}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
