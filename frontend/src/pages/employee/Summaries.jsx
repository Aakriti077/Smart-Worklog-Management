import { useEffect, useState } from 'react'
import { Sparkles, RefreshCw, BookOpen, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react'
import api from '../../api/axios'

const PERIODS = [
  { key: '1w',   label: '1 Week' },
  { key: '1m',   label: '1 Month' },
  { key: '3m',   label: '3 Months' },
  { key: '6m',   label: '6 Months' },
  { key: '1y',   label: '1 Year' },
  { key: 'all',  label: 'All Time' },
]
const PERIOD_DAYS = { '1w': 7, '1m': 30, '3m': 90, '6m': 182, '1y': 365 }
const GENERATE_LABEL = {
  all: 'All Time', '1w': '1 Week', '1m': 'Last Month',
  '3m': 'Last 3 Months', '6m': 'Last 6 Months', '1y': 'Last Year',
}

function todayStr() { return new Date().toISOString().slice(0, 10) }

function formatPeriodLabel(weekStart, periodEnd) {
  const end = periodEnd || weekStart
  const startD = new Date(weekStart + 'T00:00:00')
  const endD   = new Date(end + 'T00:00:00')
  const diffDays = Math.round((endD - startD) / 86400000)
  const fmt      = d => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  const fmtShort = d => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
  if (diffDays === 0) return fmt(weekStart)
  if (diffDays <= 8)  return `Week  ${fmtShort(weekStart)} – ${fmt(end)}`
  if (diffDays <= 35) return `Last 30 Days  ·  ${fmtShort(weekStart)} – ${fmt(end)}`
  if (diffDays <= 95) return `Last 3 Months  ·  ${fmtShort(weekStart)} – ${fmt(end)}`
  if (diffDays <= 190) return `Last 6 Months  ·  ${fmtShort(weekStart)} – ${fmt(end)}`
  return `Last Year  ·  ${fmtShort(weekStart)} – ${fmt(end)}`
}

function SummaryCard({ s }) {
  const lines = (s.summary_text || '').split('\n').filter(Boolean)
  const stats = {}
  const highlights = []
  const blockers = []
  let inBlockers = false

  lines.forEach(line => {
    if (line.startsWith('Total logs:'))         stats.logs       = line.replace('Total logs:', '').trim()
    else if (line.startsWith('Total hours:'))    stats.hours      = line.replace('Total hours:', '').trim()
    else if (line.startsWith('Completion rate:')) stats.completion = line.replace('Completion rate:', '').trim()
    else if (line.startsWith('Top categories:')) stats.categories = line.replace('Top categories:', '').trim()
    else if (line.startsWith('Top clusters:'))   stats.clusters   = line.replace('Top clusters:', '').trim()
    else if (line.startsWith('Key highlights:')) { inBlockers = false }
    else if (line.startsWith('Blockers detected:')) { inBlockers = true }
    else if (inBlockers && (line.startsWith('⚠') || line.startsWith('-'))) blockers.push(line.replace(/^[⚠\-]\s*/, ''))
    else if (!inBlockers && (line.startsWith('•') || line.startsWith('-'))) highlights.push(line.replace(/^[•\-]\s*/, ''))
  })

  const hasStats    = stats.logs || stats.hours || stats.completion
  const periodLabel = formatPeriodLabel(s.week_start, s.period_end)

  return (
    <div className="card">
      {/* Transparent/light header — no purple */}
      <div style={{
        background: '#f8fafc',
        borderBottom: '1px solid #e2e8f0',
        padding: '14px 20px',
        borderRadius: '12px 12px 0 0',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <BookOpen size={14} color="#4f46e5" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>{periodLabel}</div>
          <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 1 }}>
            Generated {new Date(s.generated_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 22px' }}>
        {hasStats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
            {stats.logs && (
              <div style={{ background: '#eef2ff', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#4f46e5' }}>{stats.logs}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Logs</div>
              </div>
            )}
            {stats.hours && (
              <div style={{ background: '#fffbeb', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#d97706' }}>{stats.hours}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Hours</div>
              </div>
            )}
            {stats.completion && (
              <div style={{ background: '#ecfdf5', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#059669' }}>{stats.completion}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Completion</div>
              </div>
            )}
          </div>
        )}

        {stats.categories && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>Top Work Categories</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {stats.categories.split(',').map(c => <span key={c} className="badge badge-blue">{c.trim()}</span>)}
            </div>
          </div>
        )}

        {stats.clusters && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>Work Clusters</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {stats.clusters.split(',').map(c => <span key={c} className="badge badge-purple">{c.trim()}</span>)}
            </div>
          </div>
        )}

        {highlights.length > 0 && (
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 10 }}>Key Highlights</div>
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 16px', borderLeft: '3px solid #4f46e5' }}>
              {highlights.map((h, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: i < highlights.length - 1 ? 10 : 0 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4f46e5', marginTop: 7, flexShrink: 0 }} />
                  <p style={{ fontSize: 13.5, lineHeight: 1.6, color: '#334155', margin: 0 }}>{h}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {blockers.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: '#dc2626', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
              <AlertTriangle size={12} color="#dc2626" /> Blockers Detected
            </div>
            <div style={{ background: '#fef2f2', borderRadius: 10, padding: '14px 16px', borderLeft: '3px solid #dc2626' }}>
              {blockers.map((b, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: i < blockers.length - 1 ? 10 : 0 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#dc2626', marginTop: 7, flexShrink: 0 }} />
                  <p style={{ fontSize: 13.5, lineHeight: 1.6, color: '#7f1d1d', margin: 0 }}>{b}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {highlights.length === 0 && !hasStats && (
          <p style={{ fontSize: 14, lineHeight: 1.75, color: '#334155' }}>{s.summary_text}</p>
        )}
      </div>
    </div>
  )
}

export default function Summaries() {
  const [summaries, setSummaries]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [generating, setGenerating] = useState(false)
  const [msg, setMsg]               = useState(null)
  const [period, setPeriod]         = useState('1w')
  const [dateFilter, setDateFilter] = useState('')

  const handlePeriod  = p => { setPeriod(p); setDateFilter('') }
  const handleDatePick = d => { setDateFilter(d); if (d) setPeriod(''); else setPeriod('all') }

  useEffect(() => {
    api.get('/summaries/me/').then(r => setSummaries(r.data)).finally(() => setLoading(false))
  }, [])

  // Show exactly one summary matching the selected period
  const displayedSummary = dateFilter
    ? summaries.find(s => s.week_start <= dateFilter && (s.period_end || s.week_start) >= dateFilter)
    : summaries.find(s => s.period_type === period)

  const generateOwn = async () => {
    setGenerating(true); setMsg(null)
    try {
      const payload = {}
      if (dateFilter) {
        payload.date = dateFilter
      } else {
        payload.period = period || '1w'
      }
      const res = await api.post('/summaries/me/generate/', payload)
      // Replace any existing summary for this period_type, then add the new one
      setSummaries(prev => [res.data, ...prev.filter(s => s.period_type !== res.data.period_type)])
      const label = dateFilter ? dateFilter : (GENERATE_LABEL[period] || 'This Week')
      setMsg({ type: 'success', text: `Summary generated for ${label}!` })
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'No logs found for this period.' })
    } finally {
      setGenerating(false)
    }
  }

  const genLabel = dateFilter ? dateFilter : (GENERATE_LABEL[period] || 'This Week')

  if (loading) return <div className="loading-page"><div className="spinner" /></div>

  return (
    <div className="page">
      {/* Header bar — filter + generate */}
      <div style={{
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14,
        padding: '14px 20px', marginBottom: 18,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)', gap: 12, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={16} color="#4f46e5" />
          <span style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>AI-Powered Summaries</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Period dropdown */}
          <select
            value={dateFilter ? '__date__' : period}
            onChange={e => handlePeriod(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, color: '#1e293b', background: '#fff', cursor: 'pointer', outline: 'none' }}
          >
            {PERIODS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
            {dateFilter && <option value="__date__">{dateFilter}</option>}
          </select>

          {/* Date picker */}
          <input
            type="date"
            value={dateFilter}
            onChange={e => handleDatePick(e.target.value)}
            max={todayStr()}
            title="Pick a specific date"
            style={{
              padding: '6px 8px', borderRadius: 8,
              border: dateFilter ? '2px solid #4f46e5' : '1px solid #e2e8f0',
              fontSize: 12, color: dateFilter ? '#4f46e5' : '#94a3b8',
              background: '#fff', outline: 'none', cursor: 'pointer', width: 36,
            }}
          />
          {dateFilter && (
            <button onClick={() => handleDatePick('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 14, lineHeight: 1, padding: 0 }}>✕</button>
          )}

          <button className="btn btn-primary" onClick={generateOwn} disabled={generating} style={{ flexShrink: 0 }}>
            <RefreshCw size={14} className={generating ? 'spin' : ''} />
            {generating ? 'Generating…' : `Generate ${genLabel}`}
          </button>
        </div>
      </div>

      {/* Alert */}
      {msg && (
        <div className={`alert alert-${msg.type === 'success' ? 'success' : 'error'}`} style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {msg.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            {msg.text}
          </span>
          <button onClick={() => setMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 16, lineHeight: 1, padding: 0, marginLeft: 12, opacity: 0.6 }}>✕</button>
        </div>
      )}

      {/* Single summary card for the selected period */}
      {displayedSummary ? (
        <SummaryCard s={displayedSummary} />
      ) : (
        <div className="card">
          <div className="card-body">
            <div className="empty-state">
              <h3>No Summary Yet</h3>
              <p>Select a period and click Generate to create your AI-powered summary.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
