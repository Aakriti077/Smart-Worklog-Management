import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import { FileText, Calendar, Award, ListChecks, Zap, Sparkles, Plus } from 'lucide-react'

function StatCard({ label, value, icon: Icon, color, sub }) {
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
        {sub && <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 4 }}>{sub}</div>}
      </div>
    </div>
  )
}

export default function EmployeeDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [logs, setLogs]     = useState([])
  const [tasks, setTasks]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/worklogs/'), api.get('/tasks/')])
      .then(([l, t]) => { setLogs(l.data); setTasks(t.data) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-page"><div className="spinner" /></div>

  // ── This-week stats ──
  const now = new Date()
  const dayOfWeek = now.getDay()
  const mon = new Date(now)
  mon.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
  mon.setHours(0, 0, 0, 0)
  const thisWeekLogs = logs.filter(l => new Date(l.date + 'T00:00:00') >= mon)

  const totalPlanned   = thisWeekLogs.reduce((a, l) => a + l.tasks_planned, 0)
  const totalCompleted = thisWeekLogs.reduce((a, l) => a + l.tasks_completed, 0)
  const completionRate = totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : null

  const openTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress')
  const totalTasks = tasks.length

  // ── Streak ──
  const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
  const yesterday = (() => { const d = new Date(now); d.setDate(d.getDate()-1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` })()
  const sortedDates = [...new Set(logs.map(l => l.date))].sort().reverse()
  let streak = 0
  if (sortedDates[0] === today || sortedDates[0] === yesterday) {
    for (let i = 0; i < sortedDates.length; i++) {
      const base = new Date(sortedDates[0] + 'T00:00:00')
      const d    = new Date(sortedDates[i] + 'T00:00:00')
      if (Math.round((base - d) / 86400000) === i) streak++
      else break
    }
  }

  const hasLogToday = logs.some(l => l.date === today)

  // ── Task breakdown ──
  const taskBreakdown = {
    completed:   tasks.filter(t => t.status === 'completed').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    pending:     tasks.filter(t => t.status === 'pending').length,
  }

  const pColors = { low: '#059669', medium: '#4f46e5', high: '#d97706', urgent: '#dc2626' }

  return (
    <div className="page">
      {/* Welcome + quick actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 21, fontWeight: 700, color: '#1e293b', margin: 0 }}>
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          {!hasLogToday && (
            <div style={{ fontSize: 12.5, color: '#d97706', marginTop: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#d97706' }} />
              No log submitted today yet
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/employee/submit-log')} style={{ gap: 5 }}>
            <Plus size={14} /> Submit Log
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/employee/kpis')} style={{ gap: 5 }}>
            <Award size={14} /> My KPIs
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/employee/summaries')} style={{ gap: 5 }}>
            <Sparkles size={14} /> Summary
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        <StatCard label="Total Logs"  value={logs.length}         icon={FileText}   color="#4f46e5" sub={`${thisWeekLogs.length} this week`} />
        <StatCard label="Completion"  value={completionRate !== null ? `${completionRate}%` : '—'} icon={Award} color="#d97706" sub="this week" />
        <StatCard label="Open Tasks"  value={openTasks.length}    icon={ListChecks} color="#7c3aed" sub={`${totalTasks} total`} />
        <StatCard label="Log Streak"  value={streak || 0}         icon={Zap}        color="#059669" sub={streak === 1 ? 'day' : 'consecutive days'} />
      </div>

      {/* Assigned Tasks */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 18 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
          <ListChecks size={14} color="#7c3aed" />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Assigned Tasks</span>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/employee/tasks')} style={{ marginLeft: 'auto' }}>View All</button>
        </div>
        {openTasks.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No open tasks</div>
        ) : (
          openTasks.slice(0, 4).map((t, i) => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 20px', borderBottom: i < Math.min(openTasks.length, 4) - 1 ? '1px solid #f8fafc' : 'none' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: pColors[t.priority] || '#4f46e5', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1e293b' }}>{t.title}</div>
                <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 1 }}>From {t.assigned_by_name}{t.deadline ? ` · Due ${t.deadline}` : ''}</div>
              </div>
              <span style={{ background: t.status === 'in_progress' ? '#eef2ff' : '#f1f5f9', color: t.status === 'in_progress' ? '#4f46e5' : '#64748b', borderRadius: 20, padding: '2px 10px', fontSize: 11.5, fontWeight: 700 }}>
                {t.status.replace('_', ' ')}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Task breakdown + Recent logs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 18 }}>

        {/* Task breakdown donut */}
        <div className="card" style={{ padding: '22px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <ListChecks size={14} color="#7c3aed" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Task Status</span>
          </div>
          {totalTasks === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: '16px 0' }}>No tasks yet</div>
          ) : (
            <>
              {(() => {
                const size = 110, r = 38, cx = 55, cy = 55, circ = 2 * Math.PI * r
                const segs = [
                  { key: 'completed',   color: '#059669', count: taskBreakdown.completed },
                  { key: 'in_progress', color: '#4f46e5', count: taskBreakdown.in_progress },
                  { key: 'pending',     color: '#e2e8f0', count: taskBreakdown.pending },
                ]
                let offset = 0
                return (
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
                      {segs.map(seg => {
                        const len = (seg.count / totalTasks) * circ
                        const el = (
                          <circle key={seg.key} cx={cx} cy={cy} r={r}
                            fill="none" stroke={seg.color} strokeWidth={14}
                            strokeDasharray={`${len} ${circ - len}`}
                            strokeDashoffset={-offset}
                          />
                        )
                        offset += len
                        return el
                      })}
                    </svg>
                  </div>
                )
              })()}
              {[
                { label: 'Completed',   color: '#059669', count: taskBreakdown.completed },
                { label: 'In Progress', color: '#4f46e5', count: taskBreakdown.in_progress },
                { label: 'Pending',     color: '#94a3b8', count: taskBreakdown.pending },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: '#64748b' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: row.color }} />
                    {row.label}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{row.count}</span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Recent logs */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={14} color="#4f46e5" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Recent Logs</span>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/employee/logs')} style={{ marginLeft: 'auto' }}>
              View All
            </button>
          </div>
          {logs.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No logs yet</div>
          ) : (
            logs.slice(0, 5).map((l, i) => {
              const comp = l.tasks_planned > 0 ? Math.round((l.tasks_completed / l.tasks_planned) * 100) : null
              const text = l.log_text?.trim()
              const preview = text ? (text.length > 55 ? text.slice(0, 55) + '…' : text) : '—'
              return (
                <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', borderBottom: i < 4 ? '1px solid #f8fafc' : 'none' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 700, color: '#4f46e5' }}>
                    {l.hours_worked}h
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {preview}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{l.date}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                    {l.svm_category_name && (
                      <span style={{ background: '#eef2ff', color: '#4f46e5', borderRadius: 6, padding: '2px 8px', fontSize: 10.5, fontWeight: 600 }}>{l.svm_category_name}</span>
                    )}
                    {comp !== null && (
                      <span style={{ background: comp >= 80 ? '#ecfdf5' : comp >= 50 ? '#fffbeb' : '#fef2f2', color: comp >= 80 ? '#059669' : comp >= 50 ? '#d97706' : '#dc2626', borderRadius: 6, padding: '2px 8px', fontSize: 10.5, fontWeight: 600 }}>{comp}%</span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
