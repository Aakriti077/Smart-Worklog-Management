import { useEffect, useState } from 'react'
import { Search, Edit2, Trash2, X, CheckCircle, AlertCircle, Clock, CheckSquare, Cpu, Layers } from 'lucide-react'
import api from '../../api/axios'

function EditModal({ log, onClose, onSaved }) {
  const [form, setForm] = useState({
    log_text: log.log_text,
    tasks_planned: log.tasks_planned,
    tasks_completed: log.tasks_completed,
    hours_worked: log.hours_worked || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!form.log_text.trim()) { setError('Description cannot be empty.'); return }
    setSaving(true); setError('')
    try {
      const res = await api.put(`/worklogs/${log.id}/`, form)
      onSaved(res.data)
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 16,
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 560,
        boxShadow: '0 24px 64px rgba(15,23,42,0.18)',
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#1e293b' }}>Edit Work Log</div>
            <div style={{ fontSize: 12.5, color: '#94a3b8', marginTop: 2 }}>{log.date}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: '20px 24px' }}>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13.5, color: '#dc2626', display: 'flex', gap: 8, alignItems: 'center' }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Work Description</label>
            <textarea
              className="form-input"
              value={form.log_text}
              onChange={e => setForm({ ...form, log_text: e.target.value })}
              rows={4}
              style={{ resize: 'vertical' }}
            />
            <div className="form-hint">Editing the description will re-run ML classification automatically.</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Planned</label>
              <input className="form-input" type="number" min="0" value={form.tasks_planned} onChange={e => setForm({ ...form, tasks_planned: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Completed</label>
              <input className="form-input" type="number" min="0" value={form.tasks_completed} onChange={e => setForm({ ...form, tasks_completed: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Hours</label>
              <input className="form-input" type="number" min="0" max="24" step="0.5" value={form.hours_worked} onChange={e => setForm({ ...form, hours_worked: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={onClose} disabled={saving}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
              {saving ? <><span className="spinner" style={{ width: 12, height: 12 }} /> Saving...</> : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const PAGE_SIZE = 10

function Pagination({ page, total, onChange }) {
  const totalPages = Math.ceil(total / PAGE_SIZE)
  if (totalPages <= 1) return null
  const pages = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else if (page <= 4) {
    pages.push(1, 2, 3, 4, 5, '…', totalPages)
  } else if (page >= totalPages - 3) {
    pages.push(1, '…', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
  } else {
    pages.push(1, '…', page - 1, page, page + 1, '…', totalPages)
  }
  const btn = (label, target, disabled, active = false) => (
    <button key={label} onClick={() => onChange(target)} disabled={disabled} style={{
      minWidth: 32, height: 32, padding: '0 10px', border: active ? 'none' : '1px solid #e2e8f0',
      borderRadius: 7, background: active ? '#4f46e5' : disabled ? '#f8fafc' : '#fff',
      color: active ? '#fff' : disabled ? '#cbd5e1' : '#1e293b',
      fontWeight: active ? 700 : 500, fontSize: 13, cursor: disabled ? 'default' : 'pointer',
    }}>{label}</button>
  )
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid #f1f5f9' }}>
      <span style={{ fontSize: 12.5, color: '#94a3b8' }}>
        {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} logs
      </span>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {btn('←', page - 1, page === 1)}
        {pages.map((p, i) => p === '…'
          ? <span key={`d${i}`} style={{ padding: '0 4px', color: '#94a3b8', fontSize: 13 }}>…</span>
          : btn(p, p, false, p === page)
        )}
        {btn('→', page + 1, page === totalPages)}
      </div>
    </div>
  )
}

const PERIODS = [
  { key: 'today',     label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: '1w',        label: '1 Week' },
  { key: '1m',        label: '1 Month' },
  { key: '3m',        label: '3 Months' },
  { key: '6m',        label: '6 Months' },
  { key: '1y',        label: '1 Year' },
  { key: 'all',       label: 'All Time' },
]
const PERIOD_DAYS = { '1w': 7, '1m': 30, '3m': 90, '6m': 182, '1y': 365 }
function todayStr() { return new Date().toISOString().slice(0, 10) }

export default function EmployeeLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [period, setPeriod] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [editLog, setEditLog] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [page, setPage] = useState(1)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState(null)

  const handlePeriod = p => { setPeriod(p); setDateFilter('') }
  const handleDatePick = d => { setDateFilter(d); if (d) setPeriod(''); else setPeriod('all') }

  const dateInRange = log => {
    if (dateFilter) return log.date === dateFilter
    const today = todayStr()
    if (period === 'today') return log.date === today
    if (period === 'yesterday') {
      const d = new Date(today); d.setDate(d.getDate() - 1)
      return log.date === d.toISOString().slice(0, 10)
    }
    if (period === 'all' || !period) return true
    if (PERIOD_DAYS[period]) {
      const from = new Date(today)
      from.setDate(from.getDate() - PERIOD_DAYS[period])
      return log.date >= from.toISOString().slice(0, 10)
    }
    return true
  }

  useEffect(() => {
    api.get('/worklogs/').then(r => setLogs(r.data)).finally(() => setLoading(false))
  }, [])

  const showToast = (type, text) => {
    setToast({ type, text })
    setTimeout(() => setToast(null), 3500)
  }

  const handleSaved = updated => {
    setLogs(prev => prev.map(l => l.id === updated.id ? updated : l))
    setEditLog(null)
    showToast('success', 'Log updated and ML re-classified.')
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/worklogs/${deleteId}/`)
      setLogs(prev => prev.filter(l => l.id !== deleteId))
      setDeleteId(null)
      showToast('success', 'Log deleted successfully.')
    } catch {
      showToast('error', 'Failed to delete log.')
    } finally {
      setDeleting(false)
    }
  }

  const filtered = logs.filter(l => {
    const matchSearch = !search || l.log_text.toLowerCase().includes(search.toLowerCase())
    return matchSearch && dateInRange(l)
  })

  useEffect(() => setPage(1), [search, period, dateFilter])
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const totalHours = filtered.reduce((s, l) => s + (parseFloat(l.hours_worked) || 0), 0)
  const avgCompletion = filtered.length
    ? Math.round(filtered.reduce((s, l) => s + (l.tasks_planned ? l.tasks_completed / l.tasks_planned : 0), 0) / filtered.length * 100)
    : 0

  if (loading) return <div className="loading-page"><div className="spinner" /></div>

  return (
    <div className="page">
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 2000,
          background: toast.type === 'success' ? '#ecfdf5' : '#fef2f2',
          border: `1px solid ${toast.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          color: toast.type === 'success' ? '#065f46' : '#dc2626',
          borderRadius: 10, padding: '12px 18px', fontSize: 13.5,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {toast.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          {toast.text}
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total Logs', value: filtered.length, icon: CheckSquare, color: '#4f46e5', bg: '#eef2ff' },
          { label: 'Total Hours', value: totalHours.toFixed(1) + 'h', icon: Clock, color: '#d97706', bg: '#fffbeb' },
          { label: 'Avg Completion', value: avgCompletion + '%', icon: CheckCircle, color: '#059669', bg: '#ecfdf5' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <s.icon size={18} color={s.color} />
            </div>
            <div>
              <div style={{ fontSize: 11.5, color: '#94a3b8', fontWeight: 500 }}>{s.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#1e293b' }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="card">
        <div className="card-header" style={{ padding: '16px 24px', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 200 }}>
            <Search size={14} color="#94a3b8" />
            <input
              className="form-input"
              style={{ border: 'none', padding: '4px 0', outline: 'none', fontSize: 13.5 }}
              placeholder="Search your logs..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select
              value={dateFilter ? '__date__' : period}
              onChange={e => handlePeriod(e.target.value)}
              className="form-input"
              style={{ width: 120, padding: '5px 10px' }}
            >
              {PERIODS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
              {dateFilter && <option value="__date__">{dateFilter}</option>}
            </select>
            <input
              type="date"
              value={dateFilter}
              onChange={e => handleDatePick(e.target.value)}
              max={todayStr()}
              title="Pick a specific date"
              style={{
                padding: '5px 8px', borderRadius: 8,
                border: dateFilter ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                fontSize: 12, color: dateFilter ? '#4f46e5' : '#94a3b8',
                background: '#fff', outline: 'none', cursor: 'pointer', width: 36,
              }}
            />
            {dateFilter && (
              <button onClick={() => handleDatePick('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 14, lineHeight: 1, padding: 0 }}>✕</button>
            )}
            <span style={{ fontSize: 12.5, color: '#94a3b8', whiteSpace: 'nowrap' }}>{filtered.length} logs</span>
          </div>
        </div>

        <div className="table-wrap" style={{ minHeight: 580 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th><Cpu size={12} style={{ marginRight: 4 }} />SVM Category</th>
                <th><Layers size={12} style={{ marginRight: 4 }} />Cluster</th>
                <th>Tasks</th>
                <th>Hours</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(log => {
                const rate = log.tasks_planned ? Math.round(log.tasks_completed / log.tasks_planned * 100) : null
                return (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{log.date}</div>
                    </td>
                    <td style={{ maxWidth: 400 }}>
                      <div style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.55, wordBreak: 'break-word' }}>
                        {log.log_text}
                      </div>
                    </td>
                    <td>
                      {log.svm_category_name
                        ? <span className="badge badge-blue">{log.svm_category_name}</span>
                        : <span style={{ color: '#94a3b8', fontSize: 12.5 }}>—</span>}
                    </td>
                    <td>
                      {log.cluster_name
                        ? <span className="badge badge-purple">{log.cluster_name}</span>
                        : <span style={{ color: '#94a3b8', fontSize: 12.5 }}>—</span>}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{log.tasks_completed}/{log.tasks_planned}</div>
                      {rate !== null && (
                        <div style={{ fontSize: 11, color: rate >= 80 ? '#059669' : rate >= 50 ? '#d97706' : '#dc2626', marginTop: 1 }}>
                          {rate}%
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: 13, fontWeight: 600 }}>{log.hours_worked ? `${log.hours_worked}h` : <span style={{ color: '#94a3b8' }}>—</span>}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => setEditLog(log)}
                          style={{ background: '#eef2ff', border: 'none', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: '#4f46e5' }}
                          title="Edit"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteId(log.id)}
                          style={{ background: '#fef2f2', border: 'none', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: '#dc2626' }}
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7}>
                  <div className="empty-state" style={{ padding: 20 }}>
                    <h3>No Logs Found</h3>
                    <p>{logs.length === 0 ? 'Submit your first work log to get started.' : 'Try clearing the filters.'}</p>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} total={filtered.length} onChange={setPage} />
      </div>

      {/* Edit modal */}
      {editLog && <EditModal log={editLog} onClose={() => setEditLog(null)} onSaved={handleSaved} />}

      {/* Delete confirmation */}
      {deleteId && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 16,
        }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: '28px 32px', maxWidth: 380, textAlign: 'center', boxShadow: '0 24px 64px rgba(15,23,42,0.18)' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#fef2f2', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trash2 size={22} color="#dc2626" />
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>Delete this log?</div>
            <div style={{ fontSize: 13.5, color: '#64748b', marginBottom: 22 }}>This action cannot be undone. The log and its ML classification will be permanently deleted.</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)} disabled={deleting}>Cancel</button>
              <button
                style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? <><span className="spinner" style={{ width: 12, height: 12, borderTopColor: '#fff' }} />Deleting...</> : 'Delete Log'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
