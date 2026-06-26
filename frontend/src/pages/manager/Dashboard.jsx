import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import { Users, Target, TrendingUp, Trophy, AlertTriangle, Activity, CheckCircle, Clock } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, LineChart, Line
} from 'recharts'

const METRICS = ['productivity', 'consistency', 'quality', 'leadership', 'collaboration', 'innovation']
const METRIC_COLORS = {
  productivity: '#4f46e5', consistency: '#0891b2', quality: '#059669',
  leadership: '#7c3aed', collaboration: '#0284c7', innovation: '#dc2626',
}

function scoreColor(s) {
  s = parseFloat(s)
  return s >= 75 ? '#059669' : s >= 50 ? '#d97706' : '#dc2626'
}

function getGrade(s) {
  s = parseFloat(s)
  if (s >= 80) return { letter: 'A', color: '#059669', bg: '#ecfdf5' }
  if (s >= 65) return { letter: 'B', color: '#0891b2', bg: '#ecfeff' }
  if (s >= 50) return { letter: 'C', color: '#d97706', bg: '#fffbeb' }
  return { letter: 'D', color: '#dc2626', bg: '#fef2f2' }
}

function StatCard({ label, value, sub, icon: Icon, color, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
      padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      display: 'flex', alignItems: 'flex-start', gap: 14,
      cursor: onClick ? 'pointer' : 'default',
      transition: 'box-shadow 0.15s',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10, background: color + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={19} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{value ?? '—'}</div>
        {sub && <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 4 }}>{sub}</div>}
      </div>
    </div>
  )
}

export default function ManagerDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [kpis, setKpis] = useState([])
  const [recentLogs, setRecentLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/users/'),
      api.get('/kpi/rankings/?period=1m'),
      api.get('/worklogs/'),
    ]).then(([u, k, l]) => {
      setUsers(u.data)
      setKpis(k.data)
      const sorted = [...l.data].sort((a, b) => new Date(b.date) - new Date(a.date))
      setRecentLogs(sorted.slice(0, 6))
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-page"><div className="spinner" /></div>

  const employees = users.filter(u => u.role === 'employee')
  const avgScore = kpis.length
    ? (kpis.reduce((a, k) => a + parseFloat(k.overall), 0) / kpis.length).toFixed(1)
    : null

  const highPerformers  = kpis.filter(k => parseFloat(k.overall) >= 65).length
  const needsAttention  = kpis.filter(k => parseFloat(k.overall) < 40).length
  const top = kpis[0]

  const barData = kpis.map(k => ({
    name: k.user_name.split(' ')[0],
    score: parseFloat(k.overall),
  }))

  const radarColors = ['#4f46e5', '#059669', '#d97706']
  const radarData = METRICS.map(m => {
    const obj = { m: m.charAt(0).toUpperCase() + m.slice(1) }
    kpis.slice(0, 3).forEach(k => { obj[k.user_name.split(' ')[0]] = parseFloat(k[m] || 0) })
    return obj
  })

  return (
    <div className="page">

      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 18 }}>
        <StatCard label="Team Size"       value={employees.length}  icon={Users}         color="#4f46e5" />
        <StatCard label="KPI Records"     value={kpis.length}       icon={Target}        color="#0891b2" />
        <StatCard label="Team Average"    value={avgScore}           icon={TrendingUp}    color={avgScore ? scoreColor(avgScore) : '#94a3b8'} />
        <StatCard label="Top Performers"  value={highPerformers}     icon={Trophy}        color="#d97706" />
        <StatCard label="Needs Attention" value={needsAttention}     icon={AlertTriangle} color="#dc2626" />
      </div>

      {kpis.length > 0 && (
        <>
          {/* ── Charts ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
            <div className="card">
              <div className="card-header">
                <div className="card-title">Team Score Comparison</div>
                <div className="card-subtitle">Overall KPI by employee</div>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={barData} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={v => [v.toFixed(1), 'Overall Score']} contentStyle={{ fontSize: 13, borderRadius: 8 }} />
                    <Bar dataKey="score" radius={[6, 6, 0, 0]}
                      fill="#4f46e5"
                      label={{ position: 'top', fontSize: 11, fill: '#64748b', formatter: v => v.toFixed(0) }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {kpis.length >= 2 ? (
              <div className="card">
                <div className="card-header">
                  <div className="card-title">Top 3 Skill Radar</div>
                  <div className="card-subtitle">Multi-dimension comparison</div>
                </div>
                <div className="card-body">
                  <ResponsiveContainer width="100%" height={180}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="m" tick={{ fontSize: 10, fill: '#64748b' }} />
                      {kpis.slice(0, 3).map((k, i) => (
                        <Radar key={k.user || i} dataKey={k.user_name.split(' ')[0]}
                          stroke={radarColors[i]} fill={radarColors[i]} fillOpacity={0.12} strokeWidth={2} />
                      ))}
                      <Tooltip formatter={v => [v.toFixed(1), 'Score']} contentStyle={{ fontSize: 13, borderRadius: 8 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginTop: 6 }}>
                    {kpis.slice(0, 3).map((k, i) => (
                      <div key={k.user || i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                        <div style={{ width: 9, height: 9, borderRadius: '50%', background: radarColors[i] }} />
                        <span style={{ color: '#64748b' }}>{k.user_name.split(' ')[0]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Top performer spotlight when only 1 employee */
              top && (
                <div className="card" style={{ border: `1.5px solid ${scoreColor(top.overall)}30` }}>
                  <div className="card-header">
                    <div className="card-title">Top Performer</div>
                    <div className="card-subtitle">Highest overall score</div>
                  </div>
                  <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
                      background: getGrade(top.overall).bg, border: `2px solid ${scoreColor(top.overall)}40`,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <div style={{ fontSize: 26, fontWeight: 900, color: scoreColor(top.overall), lineHeight: 1 }}>{getGrade(top.overall).letter}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>{top.user_name}</div>
                      <div style={{ fontSize: 28, fontWeight: 900, color: scoreColor(top.overall), lineHeight: 1.2 }}>{parseFloat(top.overall).toFixed(1)}<span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}> /100</span></div>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </>
      )}

      {/* ── Bottom: Leaderboard + Recent Activity ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: 14 }}>

        {/* Leaderboard */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Team Leaderboard</div>
              <div className="card-subtitle">{kpis.length} employees evaluated</div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/manager/kpis')}>
              Manage KPIs
            </button>
          </div>
          {kpis.length === 0 ? (
            <div className="card-body">
              <div className="empty-state">
                <Trophy size={28} color="#cbd5e1" style={{ margin: '0 auto 12px', display: 'block' }} />
                <h3>No KPI Data Yet</h3>
                <p>Go to Team KPIs to calculate scores for your employees.</p>
              </div>
            </div>
          ) : (
            <div style={{ padding: '2px 20px 8px' }}>
              {kpis.map((k, i) => {
                const score = parseFloat(k.overall)
                const medal = i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : '#e2e8f0'
                const grade = getGrade(score)
                return (
                  <div key={k.user || i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '7px 0',
                    borderBottom: i < kpis.length - 1 ? '1px solid #f8fafc' : 'none',
                  }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: medal + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: medal === '#e2e8f0' ? '#94a3b8' : medal }}>#{i+1}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{k.user_name}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: grade.color, background: grade.bg, borderRadius: 5, padding: '1px 5px' }}>{grade.letter}</span>
                    </div>
                    <div style={{ width: 120, flexShrink: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: 10.5, color: '#94a3b8' }}>Overall</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: scoreColor(score) }}>{score.toFixed(1)}</span>
                      </div>
                      <div style={{ height: 4, background: '#f1f5f9', borderRadius: 3 }}>
                        <div style={{ height: '100%', width: `${score}%`, background: scoreColor(score), borderRadius: 3 }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Recent Activity</div>
              <div className="card-subtitle">Latest team work logs</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/manager/logs')}>View All</button>
          </div>
          {recentLogs.length === 0 ? (
            <div className="card-body">
              <div className="empty-state">
                <Activity size={24} color="#cbd5e1" style={{ margin: '0 auto 10px', display: 'block' }} />
                <h3>No Logs Yet</h3>
                <p>Your team hasn't submitted any work logs.</p>
              </div>
            </div>
          ) : (
            <div style={{ padding: '4px 20px 12px' }}>
              {recentLogs.map((log, i) => {
                const rate = log.tasks_planned ? Math.round(log.tasks_completed / log.tasks_planned * 100) : 0
                return (
                  <div key={log.id} style={{
                    padding: '10px 0',
                    borderBottom: i < recentLogs.length - 1 ? '1px solid #f8fafc' : 'none',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                        {log.user_name || 'Employee'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#94a3b8' }}>
                        <Clock size={10} />
                        {log.date}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4, marginBottom: 5,
                      overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
                    }}>
                      {log.log_text}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        fontSize: 10.5, fontWeight: 600, padding: '1px 7px', borderRadius: 5,
                        background: rate >= 80 ? '#ecfdf5' : rate >= 50 ? '#fffbeb' : '#fef2f2',
                        color: rate >= 80 ? '#059669' : rate >= 50 ? '#d97706' : '#dc2626',
                      }}>
                        {log.tasks_completed}/{log.tasks_planned} tasks
                      </span>
                      {log.svm_category_name && (
                        <span style={{ fontSize: 10.5, color: '#94a3b8', background: '#f1f5f9', borderRadius: 5, padding: '1px 7px' }}>
                          {log.svm_category_name}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
