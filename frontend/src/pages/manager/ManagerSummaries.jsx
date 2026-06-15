import { useEffect, useState } from 'react'
import { FileText, RefreshCw, BookOpen, CheckCircle } from 'lucide-react'
import api from '../../api/axios'

function SummaryCard({ s }) {
  const lines = s.summary_text.split(/\.\s+/).filter(Boolean)

  // Extract stats from the structured summary text
  const text = s.summary_text
  const logsMatch = text.match(/submitted (\d+) work log/)
  const rateMatch = text.match(/\((\d+)% completion rate\)/)
  const hoursMatch = text.match(/Total hours logged: ([\d.]+)h/)
  const catMatch = text.match(/Top SVM categories: ([^.]+)/)
  const clusterMatch = text.match(/Top activity clusters: ([^.]+)/)
  const highlightsMatch = text.match(/Highlights: (.+)$/)

  const stats = {
    logs: logsMatch?.[1],
    rate: rateMatch?.[1] ? rateMatch[1] + '%' : null,
    hours: hoursMatch?.[1] ? hoursMatch[1] + 'h' : null,
    categories: catMatch?.[1]?.split(',').map(c => c.trim().replace(/\s*\(\d+\)$/, '')),
    clusters: clusterMatch?.[1]?.split(',').map(c => c.trim().replace(/\s*\(\d+\)$/, '')),
    highlights: highlightsMatch?.[1],
  }

  return (
    <div className="card">
      <div style={{
        background: 'linear-gradient(135deg,#d97706,#f59e0b)',
        padding: '16px 22px', borderRadius: '12px 12px 0 0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={15} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>Week of {s.week_start}</div>
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.75)', marginTop: 1 }}>
              {new Date(s.generated_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '18px 22px' }}>
        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Logs', value: stats.logs, color: '#4f46e5', bg: '#eef2ff' },
            { label: 'Hours', value: stats.hours, color: '#d97706', bg: '#fffbeb' },
            { label: 'Completion', value: stats.rate, color: '#059669', bg: '#ecfdf5' },
          ].filter(s => s.value).map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Categories */}
        {stats.categories?.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>Work Categories</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {stats.categories.map(c => <span key={c} className="badge badge-blue">{c}</span>)}
            </div>
          </div>
        )}

        {/* Clusters */}
        {stats.clusters?.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>Activity Clusters</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {stats.clusters.map(c => <span key={c} className="badge badge-purple">{c}</span>)}
            </div>
          </div>
        )}

        {/* AI highlights */}
        {stats.highlights && (
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 16px', borderLeft: '3px solid #d97706' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>AI Highlights</div>
            <p style={{ fontSize: 13.5, lineHeight: 1.65, color: '#334155', margin: 0 }}>{stats.highlights}</p>
          </div>
        )}

        {!stats.logs && (
          <p style={{ fontSize: 13.5, lineHeight: 1.75, color: '#334155' }}>{s.summary_text}</p>
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
      const res = await api.post(`/summaries/generate/${selectedId}/`)
      setSummaries(prev => {
        const exists = prev.find(s => s.id === res.data.id)
        if (exists) return prev.map(s => s.id === res.data.id ? res.data : s)
        return [res.data, ...prev]
      })
      setMsg({ type: 'success', text: 'Summary generated successfully!' })
    } catch {
      setMsg({ type: 'error', text: 'No logs found for this week.' })
    } finally {
      setGenerating(false)
    }
  }

  const selectedUser = users.find(u => u.id === selectedId)

  return (
    <div className="page">
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20 }}>
        {/* Employee list */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', height: 'fit-content' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Employees
          </div>
          {users.length === 0 ? (
            <div style={{ padding: 16, fontSize: 13, color: 'var(--text-muted)' }}>No employees in your department</div>
          ) : users.map(u => (
            <button
              key={u.id}
              className={`nav-item ${selectedId === u.id ? 'active' : ''}`}
              style={{ borderRadius: 0, color: selectedId === u.id ? '#818cf8' : 'var(--text)', background: selectedId === u.id ? 'var(--primary-light)' : 'none' }}
              onClick={() => load(u.id)}
            >
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                {u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{u.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.department_name || 'No dept'}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Content panel */}
        <div>
          {!selectedId ? (
            <div className="card"><div className="card-body">
              <div className="empty-state"><h3>Select an Employee</h3><p>Choose an employee to view or generate their weekly AI-powered summary.</p></div>
            </div></div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700 }}>{selectedUser?.name}</h2>
                  <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{summaries.length} summaries generated</span>
                </div>
                <button className="btn btn-primary btn-sm" onClick={generate} disabled={generating}>
                  <RefreshCw size={13} className={generating ? 'spin' : ''} />
                  {generating ? 'Generating...' : 'Generate This Week'}
                </button>
              </div>

              {msg && (
                <div className={`alert alert-${msg.type === 'success' ? 'success' : 'error'}`} style={{ marginBottom: 14 }}>
                  {msg.type === 'success' && <CheckCircle size={14} />}
                  {msg.text}
                </div>
              )}

              {summaries.length === 0 ? (
                <div className="card"><div className="card-body">
                  <div className="empty-state">
                    <h3>No Summaries Yet</h3>
                    <p>Click "Generate This Week" to create an AI-powered summary from {selectedUser?.name}'s current week logs.</p>
                  </div>
                </div></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {summaries.map(s => <SummaryCard key={s.id} s={s} />)}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
