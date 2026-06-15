import { useEffect, useState } from 'react'
import { FileText, Sparkles, RefreshCw, BookOpen, BarChart2, Clock, CheckCircle } from 'lucide-react'
import api from '../../api/axios'

function SummaryCard({ s }) {
  const lines = s.summary_text.split('\n').filter(Boolean)

  const stats = {}
  const highlights = []

  lines.forEach(line => {
    if (line.startsWith('Total logs:')) stats.logs = line.replace('Total logs:', '').trim()
    else if (line.startsWith('Total hours:')) stats.hours = line.replace('Total hours:', '').trim()
    else if (line.startsWith('Completion rate:')) stats.completion = line.replace('Completion rate:', '').trim()
    else if (line.startsWith('Top categories:')) stats.categories = line.replace('Top categories:', '').trim()
    else if (line.startsWith('Top clusters:')) stats.clusters = line.replace('Top clusters:', '').trim()
    else if (line.startsWith('Key highlights:')) { /* section heading */ }
    else if (line.startsWith('•') || line.startsWith('-')) highlights.push(line.replace(/^[•\-]\s*/, ''))
  })

  const hasStats = stats.logs || stats.hours || stats.completion

  return (
    <div className="card" key={s.id}>
      <div style={{
        background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
        padding: '18px 22px',
        borderRadius: '12px 12px 0 0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={16} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14.5, color: '#fff' }}>Week of {s.week_start}</div>
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>
              Generated {new Date(s.generated_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
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
              {stats.categories.split(',').map(c => (
                <span key={c} className="badge badge-blue">{c.trim()}</span>
              ))}
            </div>
          </div>
        )}

        {stats.clusters && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>Work Clusters</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {stats.clusters.split(',').map(c => (
                <span key={c} className="badge badge-purple">{c.trim()}</span>
              ))}
            </div>
          </div>
        )}

        {highlights.length > 0 && (
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 10 }}>AI-Extracted Highlights</div>
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

        {highlights.length === 0 && !hasStats && (
          <p style={{ fontSize: 14, lineHeight: 1.75, color: '#334155' }}>{s.summary_text}</p>
        )}
      </div>
    </div>
  )
}

export default function Summaries() {
  const [summaries, setSummaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    api.get('/summaries/me/').then(r => setSummaries(r.data)).finally(() => setLoading(false))
  }, [])

  const generateOwn = async () => {
    setGenerating(true); setMsg(null)
    try {
      const res = await api.post('/summaries/me/generate/')
      setSummaries(prev => {
        const exists = prev.find(s => s.id === res.data.id)
        if (exists) return prev.map(s => s.id === res.data.id ? res.data : s)
        return [res.data, ...prev]
      })
      setMsg({ type: 'success', text: 'Summary generated from your logs this week!' })
    } catch {
      setMsg({ type: 'error', text: 'No logs found for this week. Submit a work log first.' })
    } finally {
      setGenerating(false)
    }
  }

  if (loading) return <div className="loading-page"><div className="spinner" /></div>

  return (
    <div className="page">
      {/* Header action bar */}
      <div style={{
        background: 'linear-gradient(135deg,#1e1b4b,#312e81)',
        borderRadius: 14, padding: '20px 24px', marginBottom: 22,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: -20, top: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Sparkles size={16} color="#a5b4fc" />
            <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>AI-Powered Summaries</span>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
            TF-IDF extractive analysis of your work logs. Generate your own or ask your manager.
          </p>
        </div>
        <button
          className="btn"
          onClick={generateOwn}
          disabled={generating}
          style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', flexShrink: 0 }}
        >
          <RefreshCw size={14} className={generating ? 'spin' : ''} />
          {generating ? 'Generating...' : 'Generate This Week'}
        </button>
      </div>

      {msg && (
        <div className={`alert alert-${msg.type === 'success' ? 'success' : 'error'}`} style={{ marginBottom: 16 }}>
          {msg.type === 'success' ? <CheckCircle size={14} /> : null}
          {msg.text}
        </div>
      )}

      {summaries.length === 0 ? (
        <div className="card">
          <div className="card-body">
            <div className="empty-state">
              <h3>No Summaries Yet</h3>
              <p>Click "Generate This Week" to create your first AI summary from this week's logs, or ask your manager to generate one.</p>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {summaries.map(s => <SummaryCard key={s.id} s={s} />)}
        </div>
      )}
    </div>
  )
}
