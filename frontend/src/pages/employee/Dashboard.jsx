import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import { FileText, Calendar, TrendingUp, Award, Plus, ListChecks } from 'lucide-react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts'

function scoreColor(s) {
  s = parseFloat(s)
  return s >= 75 ? '#059669' : s >= 50 ? '#d97706' : '#dc2626'
}
function scoreClass(s) {
  s = parseFloat(s)
  return s >= 75 ? 'high' : s >= 50 ? 'medium' : 'low'
}

function StatCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
      padding: '20px 22px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      display: 'flex', alignItems: 'flex-start', gap: 16,
    }}>
      <div style={{
        width: 46, height: 46, borderRadius: 10,
        background: color + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 11.5, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>
          {label}
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{value ?? '—'}</div>
        {sub && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 5 }}>{sub}</div>}
      </div>
    </div>
  )
}

export default function EmployeeDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [logs, setLogs] = useState([])
  const [kpis, setKpis] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/worklogs/'), api.get('/kpi/me/'), api.get('/tasks/')])
      .then(([l, k, t]) => { setLogs(l.data); setKpis(k.data); setTasks(t.data) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-page"><div className="spinner" /></div>

  const latest = kpis[0]
  const now = new Date()
  const mon = new Date(now)
  mon.setDate(now.getDate() - now.getDay() + 1)
  const thisWeekLogs = logs.filter(l => new Date(l.date) >= mon)

  const totalPlanned   = thisWeekLogs.reduce((a, l) => a + l.tasks_planned, 0)
  const totalCompleted = thisWeekLogs.reduce((a, l) => a + l.tasks_completed, 0)
  const completionRate = totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : null

  const radarData = latest ? [
    { m: 'Productivity', v: parseFloat(latest.productivity) },
    { m: 'Consistency',  v: parseFloat(latest.consistency) },
    { m: 'Quality',      v: parseFloat(latest.quality) },
    { m: 'Leadership',   v: parseFloat(latest.leadership) },
    { m: 'Collab',       v: parseFloat(latest.collaboration) },
    { m: 'Innovation',   v: parseFloat(latest.innovation) },
    { m: 'Learning',     v: parseFloat(latest.learning) },
  ] : []

  const kpiTrend = kpis.slice(0, 6).reverse().map(k => ({
    week: k.week_start?.slice(5),
    score: parseFloat(k.overall)
  }))

  return (
    <div className="page">
      {/* Welcome */}
      <div style={{ marginBottom: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 21, fontWeight: 700, color: '#1e293b' }}>Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p style={{ color: '#64748b', fontSize: 13.5, marginTop: 3 }}>
            {user?.department_name || 'No department'} · Performance overview for this week
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/employee/submit-log')}>
          <Plus size={14} /> New Log
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard
          label="Total Logs"
          value={logs.length}
          sub="all time"
          icon={FileText}
          color="#4f46e5"
        />
        <StatCard
          label="This Week"
          value={thisWeekLogs.length}
          sub="logs this week"
          icon={Calendar}
          color="#059669"
        />
        <StatCard
          label="Overall KPI"
          value={latest ? parseFloat(latest.overall).toFixed(1) : '—'}
          sub="latest score"
          icon={TrendingUp}
          color={latest ? scoreColor(latest.overall) : '#94a3b8'}
        />
        <StatCard
          label="Completion"
          value={completionRate !== null ? `${completionRate}%` : '—'}
          sub={completionRate !== null ? `${totalCompleted}/${totalPlanned} tasks` : 'no logs yet'}
          icon={Award}
          color="#d97706"
        />
        <StatCard
          label="Open Tasks"
          value={tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length}
          sub={`${tasks.filter(t => t.status === 'in_progress').length} in progress`}
          icon={ListChecks}
          color="#7c3aed"
        />
      </div>

      {/* KPI breakdown + Radar */}
      <div className="grid-2 mb-20">
        {latest ? (
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">KPI Breakdown</div>
                <div className="card-subtitle">Week of {latest.week_start}</div>
              </div>
              <div style={{
                padding: '4px 14px', borderRadius: 8,
                background: scoreColor(latest.overall) + '18',
                color: scoreColor(latest.overall),
                fontSize: 22, fontWeight: 800,
              }}>
                {parseFloat(latest.overall).toFixed(1)}
              </div>
            </div>
            <div className="card-body">
              <div className="kpi-grid">
                {[
                  ['Productivity', latest.productivity],
                  ['Consistency', latest.consistency],
                  ['Quality', latest.quality],
                  ['Diversity', latest.diversity],
                  ['Leadership', latest.leadership],
                  ['Collaboration', latest.collaboration],
                  ['Innovation', latest.innovation],
                  ['Learning', latest.learning],
                ].map(([label, val]) => (
                  <div className="kpi-card" key={label}>
                    <div className="kpi-label">{label}</div>
                    <div className={`kpi-score ${scoreClass(val)}`}>{parseFloat(val).toFixed(0)}</div>
                    <div className="kpi-bar">
                      <div className="kpi-bar-fill" style={{ width: `${parseFloat(val)}%`, background: scoreColor(val) }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-body">
              <div className="empty-state">
                <TrendingUp size={32} color="#cbd5e1" style={{ margin: '0 auto 12px', display: 'block' }} />
                <h3>No KPI Data Yet</h3>
                <p>Submit work logs this week, then ask your manager to calculate your KPI.</p>
                <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => navigate('/employee/submit-log')}>
                  Submit a Log
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Radar */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Performance Radar</div>
            <div className="card-subtitle">Skills visual breakdown</div>
          </div>
          <div className="card-body">
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="m" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Radar dataKey="v" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.2} strokeWidth={2} dot={{ r: 3, fill: '#4f46e5' }} />
                  <Tooltip formatter={v => [v.toFixed(1), 'Score']} contentStyle={{ fontSize: 13, borderRadius: 8 }} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state"><p>Radar will appear after your first KPI evaluation</p></div>
            )}
          </div>
        </div>
      </div>

      {/* KPI Trend */}
      {kpiTrend.length > 1 && (
        <div className="card mb-20">
          <div className="card-header">
            <div className="card-title">KPI Score Trend</div>
            <div className="card-subtitle">Overall score across recent weeks</div>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={kpiTrend} barCategoryGap="35%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={v => [v.toFixed(1), 'Overall Score']} contentStyle={{ fontSize: 13, borderRadius: 8 }} />
                <Bar dataKey="score" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Assigned Tasks snapshot */}
      {tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length > 0 && (
        <div className="card mb-20">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ListChecks size={15} color="#7c3aed" />
              <div className="card-title">Assigned Tasks</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/employee/tasks')}>View All</button>
          </div>
          <div style={{ padding: '8px 0' }}>
            {tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled').slice(0, 4).map(t => {
              const pColors = { low: '#059669', medium: '#4f46e5', high: '#d97706', urgent: '#dc2626' }
              const color = pColors[t.priority] || '#4f46e5'
              return (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 20px', borderBottom: '1px solid #f8fafc' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1e293b' }}>{t.title}</div>
                    <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 1 }}>From {t.assigned_by_name}{t.deadline ? ` · Due ${t.deadline}` : ''}</div>
                  </div>
                  <span style={{ background: t.status === 'in_progress' ? '#eef2ff' : '#f1f5f9', color: t.status === 'in_progress' ? '#4f46e5' : '#64748b', borderRadius: 20, padding: '2px 10px', fontSize: 11.5, fontWeight: 700 }}>
                    {t.status.replace('_', ' ')}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent Logs */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Recent Work Logs</div>
            <div className="card-subtitle">Your latest submissions with ML analysis</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/employee/submit-log')}>
            + New Log
          </button>
        </div>
        {logs.length === 0 ? (
          <div className="card-body">
            <div className="empty-state">
              <FileText size={28} color="#cbd5e1" style={{ margin: '0 auto 12px', display: 'block' }} />
              <h3>No Logs Yet</h3>
              <p>Start by submitting your first daily work log.</p>
            </div>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>SVM Category</th>
                  <th>K-Means Cluster</th>
                  <th>Planned</th>
                  <th>Completed</th>
                </tr>
              </thead>
              <tbody>
                {logs.slice(0, 8).map(log => (
                  <tr key={log.id}>
                    <td style={{ color: '#94a3b8', fontSize: 12.5, whiteSpace: 'nowrap' }}>{log.date}</td>
                    <td style={{ maxWidth: 300 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13.5 }}>
                        {log.log_text}
                      </div>
                    </td>
                    <td>{log.svm_category_name ? <span className="badge badge-blue">{log.svm_category_name}</span> : <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                    <td>{log.cluster_name ? <span className="badge badge-purple">{log.cluster_name}</span> : <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                    <td style={{ color: '#64748b' }}>{log.tasks_planned}</td>
                    <td>
                      <strong style={{ color: log.tasks_completed >= log.tasks_planned ? '#059669' : '#d97706' }}>
                        {log.tasks_completed}
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
