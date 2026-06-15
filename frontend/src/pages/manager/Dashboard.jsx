import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import { Users, Target, TrendingUp, Trophy } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts'

function scoreColor(s) {
  s = parseFloat(s)
  return s >= 75 ? '#059669' : s >= 50 ? '#d97706' : '#dc2626'
}

function StatCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
      padding: '20px 22px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      display: 'flex', alignItems: 'flex-start', gap: 16,
    }}>
      <div style={{
        width: 46, height: 46, borderRadius: 10, background: color + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 11.5, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{value ?? '—'}</div>
        {sub && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 5 }}>{sub}</div>}
      </div>
    </div>
  )
}

export default function ManagerDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [kpis, setKpis] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/users/'), api.get('/kpi/rankings/')])
      .then(([u, k]) => { setUsers(u.data); setKpis(k.data) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-page"><div className="spinner" /></div>

  const avgScore = kpis.length
    ? (kpis.reduce((a, k) => a + parseFloat(k.overall), 0) / kpis.length).toFixed(1)
    : null

  const top = kpis[0]
  const highPerformers = kpis.filter(k => parseFloat(k.overall) >= 75).length

  const barData = kpis.map(k => ({
    name: k.user_name.split(' ')[0],
    score: parseFloat(k.overall),
  }))

  // Radar comparison of top 3
  const metrics = ['productivity', 'consistency', 'quality', 'leadership', 'collaboration', 'innovation']
  const radarData = metrics.map(m => {
    const obj = { m: m.charAt(0).toUpperCase() + m.slice(1) }
    kpis.slice(0, 3).forEach(k => { obj[k.user_name.split(' ')[0]] = parseFloat(k[m]) })
    return obj
  })
  const radarColors = ['#4f46e5', '#059669', '#d97706']

  return (
    <div className="page">
      {/* Welcome */}
      <div style={{ marginBottom: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 21, fontWeight: 700, color: '#1e293b' }}>Team Dashboard</h1>
          <p style={{ color: '#64748b', fontSize: 13.5, marginTop: 3 }}>
            {user?.department_name || 'Your department'} · Weekly performance overview
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/manager/kpis')}>
          Calculate KPIs
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Team Size"    value={users.length} sub="employees in your dept" icon={Users}     color="#4f46e5" />
        <StatCard label="KPI Records"  value={kpis.length}  sub="evaluated this week"   icon={Target}     color="#059669" />
        <StatCard label="Team Average" value={avgScore}      sub="overall score this week" icon={TrendingUp} color={avgScore ? scoreColor(avgScore) : '#94a3b8'} />
        <StatCard label="High Performers" value={highPerformers} sub="scored 75 or above" icon={Trophy}    color="#d97706" />
      </div>

      {/* Charts row */}
      {kpis.length > 0 && (
        <div className="grid-2 mb-20">
          <div className="card">
            <div className="card-header">
              <div className="card-title">KPI Comparison</div>
              <div className="card-subtitle">Overall scores this week</div>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={v => [v.toFixed(1), 'Overall Score']} contentStyle={{ fontSize: 13, borderRadius: 8 }} />
                  <Bar dataKey="score" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {kpis.length >= 2 && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">Top 3 Skill Comparison</div>
                <div className="card-subtitle">Radar across key KPI dimensions</div>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="m" tick={{ fontSize: 10, fill: '#64748b' }} />
                    {kpis.slice(0, 3).map((k, i) => (
                      <Radar
                        key={k.id}
                        dataKey={k.user_name.split(' ')[0]}
                        stroke={radarColors[i]}
                        fill={radarColors[i]}
                        fillOpacity={0.12}
                        strokeWidth={2}
                      />
                    ))}
                    <Tooltip formatter={v => [v.toFixed(1), 'Score']} contentStyle={{ fontSize: 13, borderRadius: 8 }} />
                  </RadarChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginTop: 8 }}>
                  {kpis.slice(0, 3).map((k, i) => (
                    <div key={k.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: radarColors[i] }} />
                      <span style={{ color: '#64748b' }}>{k.user_name.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard table */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">This Week Leaderboard</div>
            <div className="card-subtitle">{kpis.length} employees evaluated</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/manager/kpis')}>
            Manage KPIs
          </button>
        </div>
        {kpis.length === 0 ? (
          <div className="card-body">
            <div className="empty-state">
              <Trophy size={28} color="#cbd5e1" style={{ margin: '0 auto 12px', display: 'block' }} />
              <h3>No KPI Data This Week</h3>
              <p>Go to Team KPIs to calculate scores for your employees.</p>
            </div>
          </div>
        ) : (
          <div className="card-body" style={{ padding: '8px 20px' }}>
            {kpis.map((k, i) => {
              const score = parseFloat(k.overall)
              const medal = i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : '#e2e8f0'
              return (
                <div key={k.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 0', borderBottom: i < kpis.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: medal + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: medal === '#e2e8f0' ? '#94a3b8' : medal }}>#{i + 1}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{k.user_name}</div>
                    <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 1 }}>
                      Productivity {parseFloat(k.productivity).toFixed(0)} · Consistency {parseFloat(k.consistency).toFixed(0)} · Leadership {parseFloat(k.leadership).toFixed(0)}
                    </div>
                  </div>
                  <div style={{ width: 140, flexShrink: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11.5, color: '#94a3b8' }}>Overall</span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: scoreColor(score) }}>{score.toFixed(1)}</span>
                    </div>
                    <div style={{ height: 5, background: '#f1f5f9', borderRadius: 3 }}>
                      <div style={{ height: '100%', width: `${score}%`, background: scoreColor(score), borderRadius: 3 }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
