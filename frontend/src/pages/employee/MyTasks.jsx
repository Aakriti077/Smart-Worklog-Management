import { useEffect, useState } from 'react'
import { CheckCircle, Clock, Zap, XCircle, Calendar, User, AlertCircle, RefreshCw } from 'lucide-react'
import api from '../../api/axios'

const PRIORITY_META = {
  low:    { label: 'Low',    color: '#059669', bg: '#ecfdf5', border: '#6ee7b7' },
  medium: { label: 'Medium', color: '#4f46e5', bg: '#eef2ff', border: '#a5b4fc' },
  high:   { label: 'High',   color: '#d97706', bg: '#fffbeb', border: '#fcd34d' },
  urgent: { label: 'Urgent', color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
}

const STATUS_FLOW = {
  pending:     { next: 'in_progress', label: 'Start Working', icon: Zap,        color: '#4f46e5' },
  in_progress: { next: 'completed',   label: 'Mark Complete', icon: CheckCircle, color: '#059669' },
  completed:   { next: 'in_progress', label: 'Reopen Task',   icon: RefreshCw,   color: '#64748b' },
}

export default function MyTasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [updating, setUpdating] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    api.get('/tasks/').then(r => setTasks(r.data)).finally(() => setLoading(false))
  }, [])

  const showToast = (type, text) => { setToast({ type, text }); setTimeout(() => setToast(null), 3000) }

  const updateStatus = async (task, newStatus) => {
    setUpdating(task.id)
    try {
      const res = await api.patch(`/tasks/${task.id}/status/`, { status: newStatus })
      setTasks(prev => prev.map(t => t.id === task.id ? res.data : t))
      const msg = newStatus === 'completed' ? `"${task.title}" marked as completed!`
        : newStatus === 'in_progress' && task.status === 'completed' ? `"${task.title}" reopened.`
        : `Started working on "${task.title}"`
      showToast('success', msg)
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to update status.')
    } finally { setUpdating(null) }
  }

  const filtered = tasks.filter(t => !filterStatus || t.status === filterStatus)

  const counts = {
    all: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  }

  if (loading) return <div className="loading-page"><div className="spinner" /></div>

  return (
    <div className="page">
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 2000, background: toast.type === 'success' ? '#ecfdf5' : '#fef2f2', border: `1px solid ${toast.type === 'success' ? '#bbf7d0' : '#fecaca'}`, color: toast.type === 'success' ? '#065f46' : '#dc2626', borderRadius: 10, padding: '12px 18px', fontSize: 13.5, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', gap: 8 }}>
          {toast.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}{toast.text}
        </div>
      )}

      {/* Status filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { key: '', label: 'All Tasks', count: counts.all, color: '#4f46e5', bg: '#eef2ff' },
          { key: 'pending', label: 'Pending', count: counts.pending, color: '#64748b', bg: '#f1f5f9' },
          { key: 'in_progress', label: 'In Progress', count: counts.in_progress, color: '#d97706', bg: '#fffbeb' },
          { key: 'completed', label: 'Completed', count: counts.completed, color: '#059669', bg: '#ecfdf5' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilterStatus(tab.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13.5,
              background: filterStatus === tab.key ? tab.bg : '#fff',
              color: filterStatus === tab.key ? tab.color : '#64748b',
              boxShadow: filterStatus === tab.key ? `0 0 0 2px ${tab.color}40` : '0 1px 3px rgba(0,0,0,0.07)',
              transition: 'all 0.15s',
            }}
          >
            {tab.label}
            <span style={{ background: filterStatus === tab.key ? tab.color : '#e2e8f0', color: filterStatus === tab.key ? '#fff' : '#64748b', borderRadius: 20, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card"><div className="card-body">
          <div className="empty-state">
            <h3>No Tasks {filterStatus ? `with status "${filterStatus.replace('_',' ')}"` : 'Assigned Yet'}</h3>
            <p>Your manager will assign tasks here. Once assigned, you can track and update their status.</p>
          </div>
        </div></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(task => {
            const pm = PRIORITY_META[task.priority] || PRIORITY_META.medium
            const flow = STATUS_FLOW[task.status]
            const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed' && task.status !== 'cancelled'

            return (
              <div key={task.id} style={{
                background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                borderLeft: `4px solid ${pm.color}`,
                overflow: 'hidden',
              }}>
                <div style={{ padding: '18px 22px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>{task.title}</span>
                        <span style={{ background: pm.bg, color: pm.color, border: `1px solid ${pm.border}`, borderRadius: 20, padding: '1px 9px', fontSize: 11, fontWeight: 700 }}>{pm.label}</span>
                        {isOverdue && <span style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 20, padding: '1px 9px', fontSize: 11, fontWeight: 700 }}>Overdue</span>}
                      </div>
                      {task.description && (
                        <p style={{ fontSize: 13.5, color: '#64748b', margin: 0, lineHeight: 1.55 }}>{task.description}</p>
                      )}
                    </div>

                    {/* Status + Action */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                      {task.status === 'cancelled' && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fef2f2', color: '#dc2626', borderRadius: 20, padding: '5px 14px', fontSize: 13, fontWeight: 700 }}>
                          <XCircle size={14} /> Cancelled
                        </span>
                      )}
                      {task.status === 'completed' && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#ecfdf5', color: '#059669', borderRadius: 20, padding: '5px 14px', fontSize: 13, fontWeight: 700 }}>
                          <CheckCircle size={14} /> Completed
                        </span>
                      )}
                      {flow && (
                        <button
                          onClick={() => updateStatus(task, flow.next)}
                          disabled={updating === task.id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 7,
                            background: task.status === 'completed' ? '#f1f5f9' : flow.color,
                            color: task.status === 'completed' ? '#64748b' : '#fff',
                            border: task.status === 'completed' ? '1px solid #e2e8f0' : 'none',
                            borderRadius: 8, padding: '6px 14px', fontWeight: 600, fontSize: 12.5,
                            cursor: 'pointer', transition: 'opacity 0.15s',
                            opacity: updating === task.id ? 0.7 : 1,
                          }}
                        >
                          {updating === task.id
                            ? <><span className="spinner" style={{ width: 12, height: 12, borderTopColor: task.status === 'completed' ? '#64748b' : '#fff' }} />Updating...</>
                            : <><flow.icon size={13} />{flow.label}</>}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Meta row */}
                  <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#94a3b8' }}>
                      <User size={12} />
                      Assigned by <strong style={{ color: '#64748b' }}>{task.assigned_by_name}</strong>
                    </div>
                    {task.deadline && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: isOverdue ? '#dc2626' : '#94a3b8' }}>
                        <Calendar size={12} />
                        Deadline: <strong>{task.deadline}</strong>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#94a3b8' }}>
                      <Clock size={12} />
                      {new Date(task.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    {task.status === 'in_progress' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#4f46e5', fontWeight: 600 }}>
                        <Zap size={12} /> Currently working
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
