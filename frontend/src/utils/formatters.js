export function formatTimestamp(ts) {
  if (!ts) return '—'
  try {
    return new Date(ts).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
  } catch { return ts }
}

export function formatDatetime(ts) {
  if (!ts) return '—'
  try {
    return new Date(ts).toLocaleString('en-IN')
  } catch { return ts }
}

export function severityColor(sev) {
  switch (sev?.toUpperCase()) {
    case 'SEVERE':   return '#ff2244'
    case 'CRITICAL': return '#ff6600'
    case 'WARNING':  return '#ffaa00'
    default:         return '#00ff88'
  }
}

export function statusColor(status) {
  switch (status?.toUpperCase()) {
    case 'BREACH':   return '#ff2244'
    case 'CRITICAL': return '#ff6600'
    case 'WARNING':  return '#ffaa00'
    default:         return '#00ff88'
  }
}

export function riskColor(category) {
  switch (category?.toUpperCase()) {
    case 'SEVERE':   return '#ff2244'
    case 'HIGH':     return '#ff6600'
    case 'MODERATE': return '#ffaa00'
    default:         return '#00ff88'
  }
}

export function truncate(str, n = 60) {
  if (!str) return ''
  return str.length > n ? str.slice(0, n) + '…' : str
}
