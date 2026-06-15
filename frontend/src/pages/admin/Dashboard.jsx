import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import {
  Users, Building2, FileText, BarChart2, TrendingUp,
  Activity, UserPlus, ClipboardList, Trophy, Zap,
  CheckCircle, AlertCircle
} from 'lucide-react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
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

function QuickActionBtn({ label, sub, icon: Icon, color, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 10,
        padding: '14px 16px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        textAlign: 'left',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.boxShadow = `0 0 0 3px ${color}14` }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)' }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 8, background: color + '12', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={16} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{label}</div>
        <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 1 }}>{sub}</div>
      </div>
    </button>
  )
}

const DONUT_COLORS = ['#4f46e5', '#059669', '#f59e0b']

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null)
  const [users, setUsers] = useState([])
  const [kpis, setKpis] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([api.get('/kpi/admin/overview/'), api.get('/users/'), api.get('/kpi/rankings/')])
      .then(([o, u, k]) => { setOverview(o.data); setUsers(u.data); setKpis(k.data) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-page"><div className="spinner" /></div>

  const employees = users.filter(u => u.role === 'employee').length
  const managers  = users.filter(u => u.role === 'manager').length
  const admins    = users.filter(u => u.role === 'admin').length

  const donutData = [
    { name: 'Employees', value: employees },
    { name: 'Managers',  value: managers },
    { name: 'Admins',    value: admins },
  ].filter(d => d.value > 0)

  const deptPerf = (overview?.dept_performance || []).filter(d => d.avg_score !== null)
  const recentActivity = overview?.recent_activity || []

  return (
    <div className="page">

      {/* ── 1. Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
        <StatCard label="Total Employees" value={overview?.total_employees}
          sub={`${overview?.active_users ?? 0} active · ${overview?.inactive_users ?? 0} inactive`}
          icon={Users} color="#4f46e5" />
        <StatCard label="Departments" value={overview?.total_departments}
          sub={`${overview?.total_managers ?? 0} managers assigned`}
          icon={Building2} color="#059669" />
        <StatCard label="Logs This Week" value={overview?.logs_this_week}
          sub={`${overview?.total_logs ?? 0} total submissions`}
          icon={FileText} color="#d97706" />
        <StatCard label="KPI Evaluations" value={overview?.kpis_this_week ?? overview?.total_kpi_records}
          sub={`${overview?.total_kpi_records ?? 0} total calculated`}
          icon={BarChart2} color="#7c3aed" />
      </div>

      {/* ── 2. Charts: Distribution + Dept Performance + Top Performers ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1.4fr', gap: 16, marginBottom: 16 }}>

        {/* Donut */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">User Distribution</div>
            <div className="card-subtitle">{employees + managers + admins} accounts</div>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={130}>
              <PieChart>
                <Pie data={donutData} cx="50%" cy="50%" innerRadius={40} outerRadius={56} dataKey="value" paddingAngle={3}>
                  {donutData.map((entry, i) => <Cell key={entry.name} fill={DONUT_COLORS[i]} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 10 }}>
              {[{ name: 'Employees', val: employees, color: '#4f46e5' }, { name: 'Managers', val: managers, color: '#059669' }, { name: 'Admins', val: admins, color: '#f59e0b' }].map(r => (
                <div key={r.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: r.color }} />
                    <span style={{ fontSize: 12.5, color: '#64748b' }}>{r.name}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: r.color }}>{r.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dept Performance */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Department Performance</div>
            <div className="card-subtitle">Avg KPI score this week</div>
          </div>
          <div className="card-body">
            {(overview?.dept_performance || []).length === 0 ? (
              <div className="empty-state" style={{ padding: '20px 0' }}><p style={{ fontSize: 13 }}>No departments yet.</p></div>
            ) : (overview?.dept_performance || []).map(d => (
              <div key={d.name} style={{ marginBottom: 13 }}>
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

        {/* Top Performers */}
        <div className="card">
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
                  <div key={k.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 0', borderBottom: i < Math.min(kpis.length, 5) - 1 ? '1px solid #f8fafc' : 'none' }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: medal + '20', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
      </div>

      {/* ── 3. Team Score Overview bar chart + Recent Activity ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Team Score Overview</div>
              <div className="card-subtitle">Overall KPI scores this week</div>
            </div>
          </div>
          <div className="card-body">
            {kpis.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px 0' }}>
                <Activity size={22} color="#cbd5e1" style={{ margin: '0 auto 8px', display: 'block' }} />
                <p style={{ fontSize: 13 }}>Chart appears once KPIs are calculated.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={kpis.map(k => ({ name: k.user_name.split(' ')[0], score: parseFloat(k.overall) }))} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={v => [v.toFixed(1), 'Overall']} contentStyle={{ fontSize: 13, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="score" fill="#4f46e5" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

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
                <div key={i} style={{ display: 'flex', gap: 11, padding: '9px 20px', borderBottom: i < recentActivity.length - 1 ? '1px solid #f8fafc' : 'none' }}>
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
      </div>

      {/* ── 4. Quick Actions ── */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={14} color="#4f46e5" />
            <div className="card-title">Quick Actions</div>
          </div>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            <QuickActionBtn label="Add New User"       sub="Create employee or manager"  icon={UserPlus}      color="#4f46e5" onClick={() => navigate('/admin/users')} />
            <QuickActionBtn label="Manage Departments" sub="Add or edit departments"     icon={Building2}     color="#059669" onClick={() => navigate('/admin/departments')} />
            <QuickActionBtn label="View Rankings"      sub="This week's KPI leaderboard" icon={Trophy}        color="#d97706" onClick={() => navigate('/admin/rankings')} />
            <QuickActionBtn label="ML Insights"        sub="Model health & test classifier" icon={BarChart2} color="#7c3aed" onClick={() => navigate('/admin/ml')} />
          </div>
        </div>
      </div>

      {/* ── 5. All Users Table ── */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">All Users</div>
            <div className="card-subtitle">{users.length} accounts in the system</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/admin/users')}>
            <UserPlus size={13} /> Manage
          </button>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Status</th><th>Joined</th></tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                        background: u.role === 'admin' ? '#eef2ff' : u.role === 'manager' ? '#fffbeb' : '#ecfdf5',
                        color: u.role === 'admin' ? '#4f46e5' : u.role === 'manager' ? '#d97706' : '#059669',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10.5, fontWeight: 700,
                      }}>
                        {u.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <strong style={{ fontSize: 13.5 }}>{u.name}</strong>
                    </div>
                  </td>
                  <td style={{ color: '#64748b', fontSize: 13 }}>{u.email}</td>
                  <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                  <td style={{ color: '#64748b', fontSize: 13 }}>{u.department_name || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      {u.is_active ? <CheckCircle size={12} color="#059669" /> : <AlertCircle size={12} color="#dc2626" />}
                      <span style={{ fontSize: 13, color: u.is_active ? '#059669' : '#dc2626', fontWeight: 500 }}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </td>
                  <td style={{ color: '#94a3b8', fontSize: 12.5 }}>{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
