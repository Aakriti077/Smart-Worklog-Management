import { useEffect, useState } from 'react'
import { Plus, X, CheckCircle, Clock, AlertCircle, Users, Trash2, RefreshCw, ListChecks, XCircle } from 'lucide-react'
import api from '../../api/axios'

const PRIORITY_META = {
  low:    { label: 'Low',    color: '#059669', bg: '#ecfdf5', border: '#6ee7b7' },
  medium: { label: 'Medium', color: '#4f46e5', bg: '#eef2ff', border: '#a5b4fc' },
  high:   { label: 'High',   color: '#d97706', bg: '#fffbeb', border: '#fcd34d' },
  urgent: { label: 'Urgent', color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
}
const STATUS_META = {
  pending:     { label: 'Pending',     color: '#64748b', bg: '#f1f5f9' },
  in_progress: { label: 'In Progress', color: '#4f46e5', bg: '#eef2ff' },
  completed:   { label: 'Completed',   color: '#059669', bg: '#ecfdf5' },
  cancelled:   { label: 'Cancelled',   color: '#dc2626', bg: '#fef2f2' },
}

function PriorityBadge({ p }) {
  const m = PRIORITY_META[p] || PRIORITY_META.medium
  return <span style={{ background: m.bg, color: m.color, border: `1px solid ${m.border}`, borderRadius: 20, padding: '2px 10px', fontSize: 11.5, fontWeight: 700 }}>{m.label}</span>
}
function StatusBadge({ s }) {
  const m = STATUS_META[s] || STATUS_META.pending
  return <span style={{ background: m.bg, color: m.color, borderRadius: 20, padding: '2px 10px', fontSize: 11.5, fontWeight: 700 }}>{m.label}</span>
}

function CreateTaskModal({ employees, onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', deadline: '', assigned_to: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async e => {
    e.preventDefault()
    if (!form.assigned_to) { setError('Please select an employee to assign.'); return }
    setSaving(true); setError('')
    try {
      const res = await api.post('/tasks/', {
        ...form,
        assigned_to: parseInt(form.assigned_to),
        deadline: form.deadline || null,
      })
      onCreated(res.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create task.')
    } finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 540, boxShadow: '0 24px 64px rgba(15,23,42,0.2)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#1e293b' }}>Assign New Task</div>
            <div style={{ fontSize: 12.5, color: '#94a3b8', marginTop: 2 }}>Task will be visible to the employee immediately</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={18} /></button>
        </div>
        <form onSubmit={submit} style={{ padding: '20px 24px' }}>
          {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#dc2626', display: 'flex', gap: 8, alignItems: 'center' }}><AlertCircle size={14} />{error}</div>}
          <div className="form-group">
            <label className="form-label">Task Title *</label>
            <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Fix login page validation bug" required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Optional details, acceptance criteria, references..." />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Assign To *</label>
              <select className="form-input" value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })} required>
                <option value="">Select employee</option>
                {employees.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Deadline</label>
              <input className="form-input" type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? <><span className="spinner" style={{ width: 12, height: 12 }} />Creating...</> : 'Assign Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ManagerTasks() {
  const [tasks, setTasks] = useState([])
  const [employees, setEmployees] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterEmployee, setFilterEmployee] = useState('')
  const [toast, setToast] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const load = () => {
    Promise.all([api.get('/tasks/team/'), api.get('/users/')])
      .then(([t, u]) => {
        setTasks(t.data.tasks || [])
        setStats(t.data.stats || {})
        setEmployees(u.data.filter(x => x.role === 'employee'))
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const showToast = (type, text) => { setToast({ type, text }); setTimeout(() => setToast(null), 3000) }

  const handleCreated = task => {
    setTasks(prev => [task, ...prev])
    setShowCreate(false)
    showToast('success', `Task "${task.title}" assigned to ${task.assigned_to_name}.`)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await api.delete(`/tasks/${deleteTarget.id}/`)
      setTasks(prev => prev.filter(t => t.id !== deleteTarget.id))
      showToast('success', `Task "${deleteTarget.title}" deleted.`)
      setDeleteTarget(null)
    } catch { showToast('error', 'Failed to delete task.') }
    finally { setDeleteLoading(false) }
  }

  const filtered = tasks.filter(t => {
    const ms = !filterStatus || t.status === filterStatus
    const me = !filterEmployee || t.assigned_to == filterEmployee
    return ms && me
  })

  if (loading) return <div className="loading-page"><div className="spinner" /></div>

  return (
    <div className="page">
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 2000, background: toast.type === 'success' ? '#ecfdf5' : '#fef2f2', border: `1px solid ${toast.type === 'success' ? '#bbf7d0' : '#fecaca'}`, color: toast.type === 'success' ? '#065f46' : '#dc2626', borderRadius: 10, padding: '12px 18px', fontSize: 13.5, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', gap: 8 }}>
          {toast.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}{toast.text}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total Assigned', value: stats.total || 0, color: '#4f46e5', bg: '#eef2ff', icon: ListChecks },
          { label: 'Pending',        value: stats.pending || 0, color: '#64748b', bg: '#f1f5f9', icon: Clock },
          { label: 'In Progress',    value: stats.in_progress || 0, color: '#d97706', bg: '#fffbeb', icon: RefreshCw },
          { label: 'Completed',      value: stats.completed || 0, color: '#059669', bg: '#ecfdf5', icon: CheckCircle },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><s.icon size={18} color={s.color} /></div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#1e293b' }}>{s.value}</div>
              <div style={{ fontSize: 11.5, color: '#64748b' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Task list card */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 10 }}>
          <div className="card-title">Team Tasks</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto' }}>
            <select className="btn btn-secondary btn-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select className="btn btn-secondary btn-sm" value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)}>
              <option value="">All Employees</option>
              {employees.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
              <Plus size={13} /> Assign Task
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="card-body">
            <div className="empty-state">
              <h3>No Tasks Yet</h3>
              <p>Click "Assign Task" to create and assign tasks to your team members.</p>
            </div>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Task</th><th>Assigned To</th><th>Priority</th><th>Status</th><th>Deadline</th><th>Logs</th><th></th></tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id}>
                    <td style={{ maxWidth: 260 }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5, color: '#1e293b' }}>{t.title}</div>
                      {t.description && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>{t.description}</div>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#eef2ff', color: '#4f46e5', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {t.assigned_to_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{t.assigned_to_name}</span>
                      </div>
                    </td>
                    <td><PriorityBadge p={t.priority} /></td>
                    <td><StatusBadge s={t.status} /></td>
                    <td style={{ fontSize: 12.5, color: t.deadline && new Date(t.deadline) < new Date() && t.status !== 'completed' ? '#dc2626' : '#64748b' }}>
                      {t.deadline || <span style={{ color: '#cbd5e1' }}>—</span>}
                    </td>
                    <td>
                      <span style={{ fontSize: 12, background: '#f1f5f9', borderRadius: 20, padding: '2px 8px', color: '#64748b', fontWeight: 600 }}>
                        {t.log_count ?? 0} logs
                      </span>
                    </td>
                    <td>
                      <button onClick={() => setDeleteTarget(t)} style={{ background: '#fef2f2', border: 'none', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: '#dc2626' }} title="Delete">
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && <CreateTaskModal employees={employees} onClose={() => setShowCreate(false)} onCreated={handleCreated} />}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 380, boxShadow: '0 24px 64px rgba(15,23,42,0.18)', padding: '28px 28px 22px' }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <XCircle size={18} color="#dc2626" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>Delete Task</div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 3, lineHeight: 1.5 }}>
                  Delete <strong>"{deleteTarget.title}"</strong>? This cannot be undone.
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setDeleteTarget(null)} disabled={deleteLoading}>Cancel</button>
              <button onClick={handleDelete} disabled={deleteLoading} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 13.5, cursor: 'pointer' }}>
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
