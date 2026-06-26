import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import {
  Users, Building2, FileText, BarChart2,
  Activity, Trophy
} from 'lucide-react'
import {
  Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts'

function sc(s) {
  s = parseFloat(s)
  return s >= 75 ? '#059669' : s >= 50 ? '#d97706' : '#dc2626'
}

function StatCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: 12,
      padding: '20px 22px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 16,
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10, flexShrink: 0,
        background: color + '14',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
          {label}
        </div>
        <div style={{ fontSize: 32, fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{value ?? '—'}</div>
        {sub && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 5 }}>{sub}</div>}
      </div>
    </div>
  )
}


export default function AdminDashboard() {
  const [overview, setOverview] = useState(null)
  const [users, setUsers] = useState([])
  const [kpis, setKpis] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([api.get('/kpi/admin/overview/'), api.get('/users/'), api.get('/kpi/rankings/?period=1m')])
      .then(([o, u, k]) => { setOverview(o.data); setUsers(u.data); setKpis(k.data) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-page"><div className="spinner" /></div>

  const deptPerf = (overview?.dept_performance || []).filter(d => d.avg_score !== null)
  const recentActivity = overview?.recent_activity || []

  return (
    <div className="page">

      {/* ── 1. Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
        <StatCard label="Total Users" value={overview?.total_users}
          icon={Users} color="#4f46e5" />
        <StatCard label="Departments" value={overview?.total_departments}
          icon={Building2} color="#059669" />
        <StatCard label="Logs This Month" value={overview?.logs_this_month}
          icon={FileText} color="#d97706" />
        <StatCard label="KPI Evaluations" value={overview?.kpis_this_month}
          icon={BarChart2} color="#7c3aed" />
      </div>

      {/* ── 2 & 3. Row 1: Dept Performance + Recent Activity | Row 2: Top Performers + Team Score ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* Row 1 Left — Dept Performance */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Department Performance</div>
            <div className="card-subtitle">Avg KPI score · last 30 days</div>
          </div>
          <div className="card-body" style={{ maxHeight: 300, overflowY: 'auto' }}>
            {(overview?.dept_performance || []).filter(d => d.name !== 'Administration').length === 0 ? (
              <div className="empty-state" style={{ padding: '20px 0' }}><p style={{ fontSize: 13 }}>No departments yet.</p></div>
            ) : (overview?.dept_performance || []).filter(d => d.name !== 'Administration').map(d => (
              <div key={d.name} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#1e293b' }}>{d.name}</span>
                  {d.avg_score !== null
                    ? <span style={{ fontSize: 13.5, fontWeight: 800, color: sc(d.avg_score) }}>{d.avg_score}</span>
                    : <span style={{ fontSize: 12, color: '#cbd5e1' }}>No data</span>}
                </div>
                <div style={{ height: 5, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                  {d.avg_score !== null && <div style={{ height: '100%', width: `${d.avg_score}%`, background: sc(d.avg_score), borderRadius: 3 }} />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Row 1 Right — Recent Activity */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Recent Activity</div>
            <div className="card-subtitle">Latest log submissions</div>
          </div>
          {recentActivity.length === 0 ? (
            <div className="card-body"><div className="empty-state" style={{ padding: '20px 0' }}><p style={{ fontSize: 13 }}>No logs submitted yet.</p></div></div>
          ) : (
            <div style={{ padding: '4px 0' }}>
              {recentActivity.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 11, padding: '10px 20px', borderBottom: i < recentActivity.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#4f46e5' }}>{a.user.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{a.user}</div>
                    <span className="badge badge-blue" style={{ fontSize: 10.5, padding: '1px 7px', marginTop: 2, display: 'inline-block' }}>{a.category}</span>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: a.completed >= a.planned ? '#059669' : '#d97706' }}>{a.completed}/{a.planned}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{a.date}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Row 2 Left — Top Performers */}
        <div className="card" style={{ paddingBottom: 12 }}>
          <div className="card-header">
            <div className="card-title">Top Performers</div>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/admin/rankings')}>View All</button>
          </div>
          {kpis.length === 0 ? (
            <div className="card-body">
              <div className="empty-state" style={{ padding: '20px 0' }}>
                <Trophy size={24} color="#cbd5e1" style={{ margin: '0 auto 8px', display: 'block' }} />
                <p style={{ fontSize: 13 }}>No KPI data yet.</p>
              </div>
            </div>
          ) : (
            <div style={{ padding: '6px 20px' }}>
              {kpis.slice(0, 5).map((k, i) => {
                const score = parseFloat(k.overall)
                const medal = ['#f59e0b', '#94a3b8', '#b45309'][i] || '#e2e8f0'
                const dept = users.find(u => u.id === k.user)?.department_name || '—'
                return (
                  <div key={k.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 0', borderBottom: i < Math.min(kpis.length, 5) - 1 ? '1px solid #f8fafc' : 'none' }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: medal + '20', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 10.5, fontWeight: 800, color: medal === '#e2e8f0' ? '#94a3b8' : medal }}>#{i + 1}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{k.user_name}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{dept}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 14.5, fontWeight: 800, color: sc(score) }}>{score.toFixed(1)}</div>
                      <div style={{ width: 44, height: 3, background: '#f1f5f9', borderRadius: 2, marginTop: 3 }}>
                        <div style={{ height: '100%', width: `${score}%`, background: sc(score), borderRadius: 2 }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Row 2 Right — Team Score Overview */}
        <div className="card" style={{ paddingBottom: 0, display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <div className="card-title">Team Score Overview</div>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/admin/rankings')}>View All</button>
          </div>
          {kpis.length === 0 ? (
            <div className="card-body">
              <div className="empty-state" style={{ padding: '20px 0' }}>
                <Activity size={22} color="#cbd5e1" style={{ margin: '0 auto 8px', display: 'block' }} />
                <p style={{ fontSize: 13 }}>Chart appears once KPIs are calculated.</p>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, padding: '12px 16px 16px' }}>
              <ResponsiveContainer width="100%" height="100%" minHeight={220}>
                <BarChart data={kpis.slice(0, 5).map(k => ({ name: k.user_name.split(' ')[0], score: parseFloat(k.overall) }))} barCategoryGap="25%" margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={v => [v.toFixed(1), 'Overall']} contentStyle={{ fontSize: 13, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="score" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>

    </div>
  )
}
