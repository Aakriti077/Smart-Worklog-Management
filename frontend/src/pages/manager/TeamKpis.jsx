import { useEffect, useState } from 'react'
import { RefreshCw, Users, Award, TrendingUp } from 'lucide-react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'
import api from '../../api/axios'

const METRICS = ['productivity', 'consistency', 'quality', 'diversity', 'leadership', 'collaboration', 'innovation', 'learning']
const METRIC_COLORS = { productivity: '#4f46e5', consistency: '#0891b2', quality: '#059669', diversity: '#d97706', leadership: '#7c3aed', collaboration: '#0284c7', innovation: '#dc2626', learning: '#b45309' }

function scoreColor(s) {
  const n = parseFloat(s)
  return n >= 75 ? '#059669' : n >= 50 ? '#d97706' : '#4f46e5'
}
function getGrade(n) {
  if (n >= 80) return { letter: 'A', color: '#059669', bg: '#ecfdf5' }
  if (n >= 65) return { letter: 'B', color: '#0891b2', bg: '#ecfeff' }
  if (n >= 50) return { letter: 'C', color: '#d97706', bg: '#fffbeb' }
  return { letter: 'D', color: '#4f46e5', bg: '#eef2ff' }
}

export default function TeamKpis() {
  const [users, setUsers] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [kpis, setKpis] = useState([])
  const [loading, setLoading] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    api.get('/users/').then(r => setUsers(r.data.filter(u => u.role === 'employee')))
  }, [])

  const loadKpis = id => {
    setSelectedId(id); setLoading(true); setMsg(null); setKpis([])
    api.get(`/kpi/user/${id}/`).then(r => setKpis(r.data)).finally(() => setLoading(false))
  }

  const calculate = async () => {
    if (!selectedId) return
    setCalculating(true); setMsg(null)
    try {
      await api.post(`/kpi/calculate/${selectedId}/`)
      setMsg({ type: 'success', text: 'KPI calculated successfully!' })
      loadKpis(selectedId)
    } catch {
      setMsg({ type: 'error', text: 'No logs found this week. Employee must submit logs first.' })
    } finally { setCalculating(false) }
  }

  const latest = kpis[0]
  const grade = latest ? getGrade(parseFloat(latest.overall)) : null
  const radarData = latest ? METRICS.map(m => ({ m: m.charAt(0).toUpperCase() + m.slice(1), v: parseFloat(latest[m]) })) : []
  const trendData = [...kpis].reverse().map(k => ({ week: k.week_start.slice(5), score: parseFloat(k.overall) }))
  const selectedUser = users.find(u => u.id === selectedId)

  return (
    <div className="page">
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 18, alignItems: 'start' }}>

        {/* Employee list sidebar */}
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
              <button key={u.id} onClick={() => loadKpis(u.id)} style={{
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

        {/* KPI content */}
        <div style={{ minWidth: 0 }}>
          {!selectedId ? (
            <div className="card">
              <div className="card-body">
                <div className="empty-state">
                  <h3>Select a Team Member</h3>
                  <p>Choose an employee from the left to view or calculate their KPI scores.</p>
                </div>
              </div>
            </div>
          ) : loading ? (
            <div className="loading-page"><div className="spinner" /></div>
          ) : (
            <>
              {/* Employee header */}
              <div className="card" style={{ padding: '16px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#eef2ff', color: '#4f46e5', fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {selectedUser?.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>{selectedUser?.name}</div>
                    <div style={{ fontSize: 12.5, color: '#94a3b8', marginTop: 1 }}>{selectedUser?.department_name || 'No department'}</div>
                  </div>
                  {latest && (
                    <div style={{ marginLeft: 8, display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: grade.bg, borderRadius: 20, border: `1px solid ${grade.color}30` }}>
                      <span style={{ fontSize: 16, fontWeight: 900, color: grade.color }}>{grade.letter}</span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: grade.color }}>{parseFloat(latest.overall).toFixed(1)}</span>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>/100</span>
                    </div>
                  )}
                </div>
                <button className="btn btn-primary btn-sm" onClick={calculate} disabled={calculating}>
                  <RefreshCw size={13} className={calculating ? 'spin' : ''} />
                  {calculating ? 'Calculating...' : 'Calculate This Week'}
                </button>
              </div>

              {msg && (
                <div className={`alert alert-${msg.type === 'success' ? 'success' : 'error'}`} style={{ marginBottom: 16 }}>
                  {msg.text}
                </div>
              )}

              {kpis.length === 0 ? (
                <div className="card">
                  <div className="card-body">
                    <div className="empty-state">
                      <h3>No KPI Records</h3>
                      <p>Click "Calculate This Week" to generate scores from {selectedUser?.name}'s submitted logs.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Metric cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 10, marginBottom: 16 }}>
                    {METRICS.map(m => (
                      <div key={m} className="card" style={{ padding: '12px 14px', minWidth: 0, overflow: 'hidden' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 4 }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 9.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m}</div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: scoreColor(latest[m]), lineHeight: 1.1, marginTop: 2 }}>
                              {parseFloat(latest[m]).toFixed(0)}
                            </div>
                          </div>
                          <div style={{ width: 26, height: 26, borderRadius: 6, background: (METRIC_COLORS[m] || '#4f46e5') + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: METRIC_COLORS[m] || '#4f46e5' }} />
                          </div>
                        </div>
                        <div style={{ height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ width: `${parseFloat(latest[m])}%`, height: '100%', background: scoreColor(latest[m]), borderRadius: 2 }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Charts row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div className="card">
                      <div className="card-header"><div className="card-title">Skill Radar</div></div>
                      <div className="card-body">
                        <ResponsiveContainer width="100%" height={210}>
                          <RadarChart data={radarData}>
                            <PolarGrid stroke="#e2e8f0" />
                            <PolarAngleAxis dataKey="m" tick={{ fontSize: 9.5, fill: '#64748b' }} />
                            <Radar dataKey="v" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.22} strokeWidth={2} dot={{ fill: '#4f46e5', r: 3 }} />
                            <Tooltip formatter={v => [v.toFixed(1), 'Score']} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="card">
                      <div className="card-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}><TrendingUp size={14} color="#4f46e5" /><div className="card-title">Score Trend</div></div>
                      </div>
                      <div className="card-body">
                        {trendData.length > 1 ? (
                          <ResponsiveContainer width="100%" height={210}>
                            <LineChart data={trendData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                              <XAxis dataKey="week" tick={{ fontSize: 9.5 }} />
                              <YAxis domain={[0, 100]} tick={{ fontSize: 9.5 }} />
                              <Tooltip formatter={v => [v.toFixed(1), 'Overall']} />
                              <Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={2.5} dot={{ fill: '#4f46e5', r: 4 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="empty-state" style={{ padding: 24 }}>
                            <p style={{ fontSize: 13 }}>Need at least 2 weeks of data for trend.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* History table */}
                  <div className="card">
                    <div className="card-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}><Award size={14} color="#4f46e5" /><div className="card-title">KPI History</div></div>
                    </div>
                    <div className="table-wrap">
                      <table className="table">
                        <thead>
                          <tr><th>Week</th><th>Productivity</th><th>Consistency</th><th>Quality</th><th>Leadership</th><th>Collaboration</th><th>Overall</th></tr>
                        </thead>
                        <tbody>
                          {kpis.map(k => (
                            <tr key={k.id}>
                              <td style={{ fontSize: 12.5, color: '#64748b' }}>{k.week_start}</td>
                              {['productivity','consistency','quality','leadership','collaboration'].map(m => (
                                <td key={m} style={{ fontWeight: 600, color: scoreColor(k[m]) }}>{parseFloat(k[m]).toFixed(0)}</td>
                              ))}
                              <td>
                                <span style={{ fontWeight: 800, fontSize: 14, color: scoreColor(k.overall) }}>{parseFloat(k.overall).toFixed(1)}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
