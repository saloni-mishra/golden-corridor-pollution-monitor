import { X, Copy, Send, RefreshCw, AlertTriangle } from 'lucide-react'
import { formatDatetime, severityColor } from '../utils/formatters'

export function LegalNoticeModal({ notice, onClose, onDispatch, onRegenerate }) {
  if (!notice) return null

  const sev = notice.severity
  const color = severityColor(sev)

  const copyNotice = () => {
    const text = [
      notice.title,
      `Notice ID: ${notice.notice_id}`,
      `Factory: ${notice.factory}`,
      `Severity: ${notice.severity}`,
      `Generated: ${formatDatetime(notice.generated_at)}`,
      '',
      notice.summary,
      '',
      'VIOLATIONS:',
      ...(notice.violations || []).map(v =>
        `  - ${v.parameter} (${v.factory_id}): ${v.observed_value} ${v.unit} (threshold: ${v.threshold} ${v.unit}) [${v.severity}]`
      ),
      '',
      'RECOMMENDED ACTIONS:',
      ...(notice.recommended_actions || []).map((a, i) => `  ${i + 1}. ${a}`),
      '',
      notice.disclaimer,
    ].join('\n')
    navigator.clipboard.writeText(text).catch(() => {})
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
      role="dialog" aria-modal="true" aria-labelledby="notice-title"
    >
      <div className="glass-panel w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        style={{ border: `1px solid ${color}44` }}>

        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-4 border-b border-slate-800"
          style={{ backgroundColor: '#0f1629' }}>
          <div>
            <h2 id="notice-title" className="font-bold text-base" style={{ color }}>
              {notice.title}
            </h2>
            <div className="text-xs mt-1 font-mono" style={{ color: '#64748b' }}>
              {notice.notice_id} · {notice.factory} · {formatDatetime(notice.generated_at)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded text-xs font-bold border"
              style={{ color, borderColor: color + '55', backgroundColor: color + '11' }}>
              {sev}
            </span>
            <button onClick={onClose} aria-label="Close notice"
              className="p-2 rounded hover:bg-slate-800 transition-colors" style={{ color: '#64748b' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Disclaimer banner */}
        <div className="mx-4 mt-4 p-3 rounded border border-yellow-800 bg-yellow-950 flex gap-2">
          <AlertTriangle size={16} className="text-yellow-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-300">
            <strong>AI-generated draft for demonstration and inspector review.</strong> {notice.disclaimer}
          </p>
        </div>

        {/* Body */}
        <div className="p-4 space-y-5">
          {/* Summary */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#64748b' }}>
              Summary
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: '#cbd5e1', whiteSpace: 'pre-wrap' }}>
              {notice.summary}
            </p>
          </section>

          {/* Violations */}
          {notice.violations?.length > 0 && (
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#64748b' }}>
                Violation Records ({notice.violations.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-left py-1.5 px-2" style={{ color: '#475569' }}>Parameter</th>
                      <th className="text-left py-1.5 px-2" style={{ color: '#475569' }}>Factory</th>
                      <th className="text-right py-1.5 px-2" style={{ color: '#475569' }}>Observed</th>
                      <th className="text-right py-1.5 px-2" style={{ color: '#475569' }}>Threshold</th>
                      <th className="text-left py-1.5 px-2" style={{ color: '#475569' }}>Severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notice.violations.map((v, i) => {
                      const vc = severityColor(v.severity)
                      return (
                        <tr key={i} className="border-b border-slate-900">
                          <td className="py-1.5 px-2" style={{ color: '#e2e8f0' }}>{v.parameter}</td>
                          <td className="py-1.5 px-2 font-mono" style={{ color: '#94a3b8' }}>{v.factory_id}</td>
                          <td className="py-1.5 px-2 text-right font-mono" style={{ color: vc }}>
                            {Number(v.observed_value).toFixed(1)} {v.unit}
                          </td>
                          <td className="py-1.5 px-2 text-right font-mono" style={{ color: '#64748b' }}>
                            {Number(v.threshold).toFixed(0)} {v.unit}
                          </td>
                          <td className="py-1.5 px-2 font-bold text-xs" style={{ color: vc }}>{v.severity}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Recommended Actions */}
          {notice.recommended_actions?.length > 0 && (
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#64748b' }}>
                Recommended Actions
              </h3>
              <ol className="space-y-1.5">
                {notice.recommended_actions.map((a, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="font-bold" style={{ color: '#ff6600', minWidth: 20 }}>{i + 1}.</span>
                    <span style={{ color: '#cbd5e1' }}>{a}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Evidence */}
          {notice.evidence?.length > 0 && (
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#64748b' }}>
                Evidence Log
              </h3>
              <div className="space-y-1 font-mono text-xs" style={{ color: '#475569' }}>
                {notice.evidence.map((e, i) => (
                  <div key={i}>{e}</div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Action bar */}
        <div className="sticky bottom-0 flex flex-wrap gap-2 p-4 border-t border-slate-800"
          style={{ backgroundColor: '#0f1629' }}>
          <button onClick={onRegenerate} aria-label="Generate again"
            className="flex items-center gap-2 px-3 py-2 rounded text-xs border transition-all hover:bg-slate-800"
            style={{ borderColor: '#334155', color: '#94a3b8' }}>
            <RefreshCw size={13} /> Generate Again
          </button>
          <button onClick={copyNotice} aria-label="Copy notice to clipboard"
            className="flex items-center gap-2 px-3 py-2 rounded text-xs border transition-all hover:bg-slate-800"
            style={{ borderColor: '#334155', color: '#94a3b8' }}>
            <Copy size={13} /> Copy Notice
          </button>
          <button onClick={onDispatch} aria-label="Dispatch regulatory alert"
            className="flex items-center gap-2 px-4 py-2 rounded text-xs font-bold border transition-all ml-auto"
            style={{ border: '1px solid rgba(59,130,246,0.5)', backgroundColor: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
            <Send size={13} /> Dispatch Alert
          </button>
          <button onClick={onClose} aria-label="Close"
            className="flex items-center gap-2 px-3 py-2 rounded text-xs border transition-all"
            style={{ borderColor: '#334155', color: '#64748b' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
