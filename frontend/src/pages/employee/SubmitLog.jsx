import { useState, useEffect } from 'react'
import { CheckCircle, Cpu, Layers, Send, ListChecks, Clock, Target, Sparkles, ChevronDown } from 'lucide-react'
import api from '../../api/axios'

const CATEGORY_COLORS = {
  'Engineering':                  '#4f46e5',
  'DevOps & Infrastructure':      '#ea580c',
  'Data Science & Analytics':     '#6d28d9',
  'Quality Assurance':            '#059669',
  'Human Resources':              '#0891b2',
  'Product':                      '#d97706',
  'Sales & Business Development': '#dc2626',
  'Finance & Accounting':         '#ca8a04',
  'UI/UX Design':                 '#db2777',
}

const PRIORITY_META = {
  low:    { color: '#059669', bg: '#ecfdf5' },
  medium: { color: '#4f46e5', bg: '#eef2ff' },
  high:   { color: '#d97706', bg: '#fffbeb' },
  urgent: { color: '#dc2626', bg: '#fef2f2' },
}

export default function SubmitLog() {
  const [form, setForm] = useState({ log_text: '', tasks_planned: '', tasks_completed: '', hours_worked: '', task: '' })
  const [myTasks, setMyTasks] = useState([])
  const [result, setResult] = useState(null)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/tasks/').then(r => setMyTasks(r.data.filter(t => t.status === 'pending' || t.status === 'in_progress'))).catch(() => {})
  }, [])

  const handleSubmit = async e => {
    e.preventDefault()
    setError(''); setSuccess(false); setResult(null)
    setLoading(true)
    try {
      const payload = { ...form, task: form.task ? parseInt(form.task) : null }
      const res = await api.post('/worklogs/', payload)
      setResult(res.data)
      setSuccess(true)
      setForm({ log_text: '', tasks_planned: '', tasks_completed: '', hours_worked: '', task: '' })
    } catch {
      setError('Failed to submit. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const completionRate = form.tasks_planned && form.tasks_completed
    ? Math.round((parseInt(form.tasks_completed) / parseInt(form.tasks_planned)) * 100)
    : null

  const selectedTask = myTasks.find(t => t.id === parseInt(form.task))

  return (
    <div className="page">
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20, alignItems: 'stretch' }}>
        {/* ── Left: Form ── */}
        <div className="card" style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column' }}>
          {success && (
            <div style={{ background: '#ecfdf5', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: '#065f46' }}>
              <CheckCircle size={16} color="#059669" />
              <div>
                <strong>Log submitted!</strong> ML classification applied automatically.
                {result?.task_title && <span style={{ marginLeft: 6 }}>Linked to: <strong>{result.task_title}</strong></span>}
              </div>
            </div>
          )}
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13.5, color: '#dc2626' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            {/* Task selector */}
            {myTasks.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ListChecks size={13} color="var(--primary)" /> Link to Assigned Task <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    className="form-input"
                    value={form.task}
                    onChange={e => setForm({ ...form, task: e.target.value })}
                    style={{ appearance: 'none', paddingRight: 36 }}
                  >
                    <option value="">No task linked</option>
                    {myTasks.map(t => (
                      <option key={t.id} value={t.id}>
                        [{t.priority.toUpperCase()}] {t.title}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} color="#94a3b8" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>
                {selectedTask && (
                  <div style={{
                    marginTop: 8, padding: '10px 14px', borderRadius: 8,
                    background: PRIORITY_META[selectedTask.priority]?.bg || '#f8fafc',
                    border: `1px solid ${PRIORITY_META[selectedTask.priority]?.color || '#e2e8f0'}30`,
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <Target size={13} color={PRIORITY_META[selectedTask.priority]?.color || '#64748b'} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: '#1e293b' }}>{selectedTask.title}</div>
                      {selectedTask.description && <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 1 }}>{selectedTask.description.slice(0, 80)}{selectedTask.description.length > 80 ? '…' : ''}</div>}
                    </div>
                    {selectedTask.deadline && <div style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>Due {selectedTask.deadline}</div>}
                  </div>
                )}
              </div>
            )}

            {/* Log text */}
            <div className="form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={13} color="var(--primary)" /> Work Description *
                </span>
                <span style={{ fontSize: 11.5, color: form.log_text.length > 50 ? '#059669' : '#94a3b8', fontWeight: 500 }}>
                  {form.log_text.length} chars
                </span>
              </label>
              <textarea
                className="form-input"
                value={form.log_text}
                onChange={e => setForm({ ...form, log_text: e.target.value })}
                placeholder="Describe what you worked on today. Be specific — the ML model uses your text to classify and cluster your work.&#10;&#10;e.g. Fixed authentication bug in login flow. Collaborated with team on API design. Researched caching strategies."
                required
                style={{ flex: 1, resize: 'none', lineHeight: 1.6, minHeight: 120 }}
              />
              {form.log_text.length > 0 && form.log_text.length < 30 && (
                <div style={{ fontSize: 11.5, color: '#d97706', marginTop: 5 }}>Too short — add more detail</div>
              )}
            </div>

            {/* Numbers row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 16 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Target size={12} color="#94a3b8" /> Tasks Planned
                </label>
                <input
                  className="form-input"
                  type="number" min="0"
                  value={form.tasks_planned}
                  onChange={e => setForm({ ...form, tasks_planned: e.target.value })}
                  placeholder="5"
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <CheckCircle size={12} color="#94a3b8" /> Tasks Completed
                </label>
                <input
                  className="form-input"
                  type="number" min="0"
                  value={form.tasks_completed}
                  onChange={e => setForm({ ...form, tasks_completed: e.target.value })}
                  placeholder="4"
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Clock size={12} color="#94a3b8" /> Hours Worked
                </label>
                <input
                  className="form-input"
                  type="number" min="0" max="24" step="0.5"
                  value={form.hours_worked}
                  onChange={e => setForm({ ...form, hours_worked: e.target.value })}
                  placeholder="8"
                />
              </div>
            </div>

            {/* Completion preview bar */}
            {completionRate !== null && (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 16px', marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12.5, color: '#64748b', fontWeight: 500 }}>Completion Rate Preview</span>
                  <strong style={{
                    color: completionRate >= 80 ? '#059669' : completionRate >= 50 ? '#d97706' : '#dc2626',
                    fontSize: 15, fontWeight: 800,
                  }}>{completionRate}%</strong>
                </div>
                <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3 }}>
                  <div style={{
                    height: '100%', borderRadius: 3,
                    width: `${Math.min(completionRate, 100)}%`,
                    background: completionRate >= 80 ? '#059669' : completionRate >= 50 ? '#d97706' : '#dc2626',
                    transition: 'width 0.3s ease',
                  }} />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 14.5, fontWeight: 700 }}
              disabled={loading}
            >
              {loading
                ? <><span className="spinner" style={{ width: 16, height: 16 }} />Processing & Classifying...</>
                : <><Send size={16} />Submit Log</>}
            </button>
          </form>
        </div>

        {/* ── Right: ML Result + Guide ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* ML result */}
          <div className="card">
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid #f1f5f9',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Cpu size={14} color="#4f46e5" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: '#1e293b' }}>ML Analysis Result</div>
                <div style={{ fontSize: 11.5, color: '#94a3b8' }}>Auto-applied on submission</div>
              </div>
            </div>
            <div style={{ padding: '16px 20px' }}>
              {result ? (
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>SVM Category</div>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      background: `${CATEGORY_COLORS[result.svm_category_name] || '#4f46e5'}12`,
                      color: CATEGORY_COLORS[result.svm_category_name] || '#4f46e5',
                      border: `1.5px solid ${CATEGORY_COLORS[result.svm_category_name] || '#4f46e5'}30`,
                      borderRadius: 9, padding: '7px 14px', fontSize: 13.5, fontWeight: 700,
                    }}>
                      <Cpu size={13} />
                      {result.svm_category_name || 'Unclassified'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>K-Means Cluster</div>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      background: '#f5f3ff', color: '#7c3aed',
                      border: '1.5px solid #ddd6fe',
                      borderRadius: 9, padding: '7px 14px', fontSize: 13.5, fontWeight: 700,
                    }}>
                      <Layers size={13} />
                      {result.cluster_name || 'Unassigned'}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 12px', color: '#94a3b8' }}>
                  <Cpu size={28} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.35 }} />
                  <p style={{ fontSize: 13, margin: 0 }}>Submit a log to see ML classification here</p>
                </div>
              )}
            </div>
          </div>

          {/* Active tasks reminder */}
          {myTasks.length > 0 && (
            <div className="card">
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
                <ListChecks size={14} color="#d97706" />
                <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>Your Active Tasks</div>
                <span style={{ marginLeft: 'auto', background: '#fffbeb', color: '#d97706', borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>{myTasks.length}</span>
              </div>
              <div style={{ padding: '10px 18px' }}>
                {myTasks.slice(0, 3).map(t => {
                  const pm = PRIORITY_META[t.priority] || PRIORITY_META.medium
                  return (
                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f8fafc' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: pm.color, flexShrink: 0 }} />
                      <div style={{ flex: 1, fontSize: 12.5, color: '#334155', fontWeight: 500 }}>
                        {t.title.length > 35 ? t.title.slice(0, 35) + '…' : t.title}
                      </div>
                      <span style={{ fontSize: 10.5, background: pm.bg, color: pm.color, borderRadius: 20, padding: '1px 7px', fontWeight: 700, flexShrink: 0 }}>
                        {t.status.replace('_', ' ')}
                      </span>
                    </div>
                  )
                })}
                {myTasks.length > 3 && <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', paddingTop: 8 }}>+{myTasks.length - 3} more tasks</div>}
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="card">
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>KPI Boosting Tips</div>
            </div>
            <div style={{ padding: '14px 18px' }}>
              {[
                { label: 'Leadership', tip: 'Use "led", "mentored" or "coordinated"' },
                { label: 'Collaboration', tip: 'Mention "collaborated" or "helped team"' },
                { label: 'Innovation', tip: 'Say "optimized", "automated" or "refactored"' },
                { label: 'Learning', tip: 'Include "researched" or "learned"' },
              ].map(h => (
                <div key={h.label} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#4f46e5', background: '#eef2ff', borderRadius: 4, padding: '2px 6px', flexShrink: 0, marginTop: 1 }}>{h.label}</span>
                  <span style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{h.tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
