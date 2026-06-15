import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import api from '../../api/axios'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts'

function scoreColor(s) { return parseFloat(s) >= 75 ? 'var(--success)' : parseFloat(s) >= 50 ? 'var(--warning)' : 'var(--danger)' }

const METRICS = ['productivity', 'consistency', 'quality', 'leadership', 'collaboration', 'innovation', 'learning']

export default function Rankings() {
  const [rankings, setRankings] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [msg, setMsg] = useState(null)
  const [tab, setTab] = useState('leaderboard')

  const load = () => {
    setLoading(true)
    Promise.all([api.get('/kpi/rankings/'), api.get('/users/')])
      .then(([r, u]) => { setRankings(r.data); setUsers(u.data) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const calculateAll = async () => {
    setCalculating(true); setMsg(null)
    const employees = users.filter(u => u.role === 'employee')
    let success = 0, failed = 0
    for (const emp of employees) {
      try { await api.post(`/kpi/calculate/${emp.id}/`); success++ }
      catch { failed++ }
    }
    setMsg({ type: success > 0 ? 'success' : 'error', text: `Calculated ${success} KPIs. ${failed} employees had no logs this week.` })
    load()
    setCalculating(false)
  }

  if (loading) return <div className="loading-page"><div className="spinner" /></div>

  const chartData = rankings.map(k => ({ name: k.user_name, score: parseFloat(k.overall) }))
  const radarCompare = METRICS.map(m => {
    const obj = { m: m.charAt(0).toUpperCase() + m.slice(1) }
    rankings.slice(0, 3).forEach(k => { obj[k.user_name] = parseFloat(k[m]) })
    return obj
  })

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div className="tabs" style={{ marginBottom: 0 }}>
          <button className={`tab ${tab === 'leaderboard' ? 'active' : ''}`} onClick={() => setTab('leaderboard')}>Leaderboard</button>
          <button className={`tab ${tab === 'chart' ? 'active' : ''}`} onClick={() => setTab('chart')}>Charts</button>
        </div>
        <button className="btn btn-primary btn-sm" onClick={calculateAll} disabled={calculating}>
          <RefreshCw size={13} /> {calculating ? 'Calculating...' : 'Calculate All KPIs'}
        </button>
      </div>

      {msg && <div className={`alert alert-${msg.type === 'success' ? 'success' : 'error'} mb-16`}>{msg.text}</div>}

      {rankings.length === 0 ? (
        <div className="card"><div className="card-body">
          <div className="empty-state">
            <h3>No Rankings Yet</h3>
            <p>Click "Calculate All KPIs" to generate scores for all employees this week.</p>
          </div>
        </div></div>
      ) : tab === 'leaderboard' ? (
        <div className="card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Rank</th><th>Employee</th><th>Dept</th><th>Productivity</th><th>Consistency</th><th>Leadership</th><th>Collab</th><th>Innovation</th><th>Overall</th></tr>
              </thead>
              <tbody>
                {rankings.map((k, i) => (
                  <tr key={k.id}>
                    <td>
                      <span style={{ fontSize: 15, fontWeight: 800, color: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : 'var(--text-muted)' }}>
                        #{i + 1}
                      </span>
                    </td>
                    <td><strong>{k.user_name}</strong></td>
                    <td className="text-muted text-sm">{users.find(u => u.id === k.user)?.department_name || '—'}</td>
                    <td>{parseFloat(k.productivity).toFixed(0)}</td>
                    <td>{parseFloat(k.consistency).toFixed(0)}</td>
                    <td>{parseFloat(k.leadership).toFixed(0)}</td>
                    <td>{parseFloat(k.collaboration).toFixed(0)}</td>
                    <td>{parseFloat(k.innovation).toFixed(0)}</td>
                    <td>
                      <strong style={{ color: scoreColor(k.overall), fontSize: 15 }}>
                        {parseFloat(k.overall).toFixed(1)}
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="card">
            <div className="card-header"><div className="card-title">Overall Score Ranking</div></div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => [v.toFixed(1), 'Overall Score']} />
                  <Bar dataKey="score" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          {radarCompare.length > 0 && (
            <div className="card">
              <div className="card-header"><div className="card-title">Top 3 Skill Comparison</div></div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={radarCompare}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="m" tick={{ fontSize: 10, fill: '#64748b' }} />
                    {rankings.slice(0, 3).map((k, i) => (
                      <Radar key={k.id} dataKey={k.user_name} stroke={['#4f46e5', '#059669', '#d97706'][i]} fill={['#4f46e5', '#059669', '#d97706'][i]} fillOpacity={0.15} strokeWidth={2} />
                    ))}
                    <Tooltip formatter={v => [v.toFixed(1), 'Score']} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
