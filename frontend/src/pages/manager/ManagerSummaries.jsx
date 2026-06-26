import { useEffect, useState } from 'react'
import { RefreshCw, Users, BookOpen, CheckCircle, AlertTriangle } from 'lucide-react'
import api from '../../api/axios'

function todayStr() { return new Date().toISOString().slice(0, 10) }

function formatPeriodLabel(weekStart, periodEnd) {
  const end = periodEnd || weekStart
  const diffDays = Math.round((new Date(end + 'T00:00:00') - new Date(weekStart + 'T00:00:00')) / 86400000)
  const fmt      = d => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  const fmtShort = d => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
  if (diffDays === 0) return fmt(weekStart)
  if (diffDays <= 8)  return `Week  ${fmtShort(weekStart)} – ${fmt(end)}`
  if (diffDays <= 35) return `1 Month  ·  ${fmtShort(weekStart)} – ${fmt(end)}`
  if (diffDays <= 95) return `3 Months  ·  ${fmtShort(weekStart)} – ${fmt(end)}`
  if (diffDays <= 190) return `6 Months  ·  ${fmtShort(weekStart)} – ${fmt(end)}`
  return `1 Year  ·  ${fmtShort(weekStart)} – ${fmt(end)}`
}

function SummaryCard({ s }) {
  const lines = (s.summary_text || '').split('\n').filter(Boolean)
  const stats = {}
  const highlights = []
  const blockers = []
  let inBlockers = false

  lines.forEach(line => {
    if (line.startsWith('Total logs:'))         stats.logs       = line.replace('Total logs:', '').trim()
    else if (line.startsWith('Total hours:'))   stats.hours      = line.replace('Total hours:', '').trim()
    else if (line.startsWith('Completion rate:')) stats.completion = line.replace('Completion rate:', '').trim()
    else if (line.startsWith('Top categories:')) stats.categories = line.replace('Top categories:', '').trim()
    else if (line.startsWith('Top clusters:'))  stats.clusters   = line.replace('Top clusters:', '').trim()
    else if (line.startsWith('Key highlights:')) { inBlockers = false }
    else if (line.startsWith('Blockers detected:')) { inBlockers = true }
    else if (inBlockers && (line.startsWith('⚠') || line.startsWith('-'))) blockers.push(line.replace(/^[⚠\-]\s*/, ''))
    else if (!inBlockers && (line.startsWith('•') || line.startsWith('-'))) highlights.push(line.replace(/^[•\-]\s*/, ''))
  })

  const hasStats = stats.logs || stats.hours || stats.completion
  const periodLabel = formatPeriodLabel(s.week_start, s.period_end)

  return (
    <div className="card">
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
                <div style={{ fontSize: 20, fontWeight: 800, color: '#4f46e5' }}>{stats.logs}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Logs</div>
              </div>
            )}
            {stats.hours && (
              <div style={{ background: '#fffbeb', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#d97706' }}>{stats.hours}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Hours</div>
              </div>
            )}
            {stats.completion && (
              <div style={{ background: '#ecfdf5', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#059669' }}>{stats.completion}</div>
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

export default function ManagerSummaries() {
  const [users, setUsers] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [summaries, setSummaries] = useState([])
  const [generating, setGenerating] = useState(false)
  const [msg, setMsg] = useState(null)
  const [genPeriod, setGenPeriod] = useState('all')
  const [genDate, setGenDate] = useState('')

  const GEN_PERIODS = [
    { key: 'today',     label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: '1w',        label: '1 Week' },
    { key: '1m',        label: '1 Month' },
    { key: '3m',        label: '3 Months' },
    { key: '6m',        label: '6 Months' },
    { key: '1y',        label: '1 Year' },
    { key: 'all',       label: 'All Time' },
  ]

  // Show the one summary that matches the currently selected period
  const displayedSummary = genDate
    ? summaries.find(s => s.week_start <= genDate && (s.period_end || s.week_start) >= genDate)
    : summaries.find(s => s.period_type === genPeriod)

  useEffect(() => {
    api.get('/users/').then(r => setUsers(r.data.filter(u => u.role === 'employee')))
  }, [])

  const load = id => {
    setSelectedId(id); setMsg(null)
    api.get(`/summaries/user/${id}/`).then(r => setSummaries(r.data))
  }

  const generate = async () => {
    if (!selectedId) return
    setGenerating(true); setMsg(null)
    try {
      const body = genDate ? { date: genDate } : { period: genPeriod }
      const res = await api.post(`/summaries/generate/${selectedId}/`, body)
      // Replace any existing summary for this period_type, then add the new one
      setSummaries(prev => [res.data, ...prev.filter(s => s.period_type !== res.data.period_type)])
      const label = genDate ? genDate : GEN_PERIODS.find(p => p.key === genPeriod)?.label
      setMsg({ type: 'success', text: `Summary generated for ${label}!` })
    } catch {
      setMsg({ type: 'error', text: 'No logs found for this period.' })
    } finally { setGenerating(false) }
  }

  const selectedUser = users.find(u => u.id === selectedId)

  return (
    <div className="page">
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 18, alignItems: 'start' }}>

        {/* Employee sidebar */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={14} color="#4f46e5" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Team Members</span>
            <span style={{ marginLeft: 'auto', fontSize: 11.5, color: '#94a3b8', background: '#f1f5f9', borderRadius: 20, padding: '1px 8px' }}>{users.length}</span>
          </div>
          {users.length === 0 ? (
            <div style={{ padding: '20px 16px', fontSize: 13, color: '#94a3b8', textAlign: 'center' }}>No employees in your team</div>
          ) : users.map(u => {
            const active = selectedId === u.id
            return (
              <button key={u.id} onClick={() => load(u.id)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', border: 'none', cursor: 'pointer', textAlign: 'left',
                background: active ? '#eef2ff' : 'transparent',
                borderLeft: active ? '3px solid #4f46e5' : '3px solid transparent',
                transition: 'all 0.15s',
              }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: active ? '#4f46e5' : '#f1f5f9', color: active ? '#fff' : '#64748b', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: active ? '#4f46e5' : '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{u.department_name || 'No dept'}</div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Content panel */}
        <div style={{ minWidth: 0 }}>
          {!selectedId ? (
            <div className="card">
              <div className="card-body">
                <div className="empty-state">
                  <h3>Select a Team Member</h3>
                  <p>Choose an employee to view or generate their AI-powered summary.</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Employee header + controls */}
              <div className="card" style={{ padding: '16px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#eef2ff', color: '#4f46e5', fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {selectedUser?.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>{selectedUser?.name}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <select
                    value={genDate ? '__date__' : genPeriod}
                    onChange={e => { setGenPeriod(e.target.value); setGenDate('') }}
                    style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, color: '#1e293b', background: '#fff', cursor: 'pointer', outline: 'none' }}
                  >
                    {GEN_PERIODS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                    {genDate && <option value="__date__">{genDate}</option>}
                  </select>
                  <input
                    type="date"
                    value={genDate}
                    onChange={e => { setGenDate(e.target.value); if (e.target.value) setGenPeriod('') }}
                    max={todayStr()}
                    title="Or pick a specific date"
                    style={{
                      padding: '6px 8px', borderRadius: 8,
                      border: genDate ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                      fontSize: 12, color: genDate ? '#4f46e5' : '#94a3b8',
                      background: '#fff', outline: 'none', cursor: 'pointer', width: 36,
                    }}
                  />
                  {genDate && (
                    <button onClick={() => { setGenDate(''); setGenPeriod('1w') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 14, lineHeight: 1, padding: 0 }}>✕</button>
                  )}
                  <button className="btn btn-primary btn-sm" onClick={generate} disabled={generating}>
                    <RefreshCw size={13} className={generating ? 'spin' : ''} />
                    {generating ? 'Generating...' : 'Generate'}
                  </button>
                </div>
              </div>

              {msg && (
                <div className={`alert alert-${msg.type === 'success' ? 'success' : 'error'}`} style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {msg.type === 'success' && <CheckCircle size={14} />} {msg.text}
                  </span>
                  <button onClick={() => setMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 16, lineHeight: 1, padding: 0, marginLeft: 12, opacity: 0.6 }}>✕</button>
                </div>
              )}

              {/* Single summary card for the selected period */}
              {displayedSummary ? (
                <SummaryCard s={displayedSummary} />
              ) : (
                <div className="card"><div className="card-body">
                  <div className="empty-state">
                    <h3>No Summary Yet</h3>
                    <p>Click "Generate" to create an AI-powered summary for {selectedUser?.name} for this period.</p>
                  </div>
                </div></div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
