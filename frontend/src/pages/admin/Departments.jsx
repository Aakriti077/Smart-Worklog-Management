import { useEffect, useState } from 'react'
import { Plus, Trash2, X, Users } from 'lucide-react'
import api from '../../api/axios'

const ROLE_COLOR = { admin: '#4f46e5', manager: '#d97706', employee: '#059669' }
const ROLE_BG    = { admin: '#eef2ff', manager: '#fffbeb', employee: '#ecfdf5' }

function MembersModal({ dept, onClose }) {
  const members = dept.members || []
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{dept.name} — Members</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={18} /></button>
        </div>
        <div className="modal-body" style={{ padding: '8px 0', maxHeight: 400, overflowY: 'auto' }}>
          {members.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8', fontSize: 13.5 }}>No active members in this department.</div>
          ) : members.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 24px', borderBottom: '1px solid #f8fafc' }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: ROLE_BG[m.role], color: ROLE_COLOR[m.role], fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {m.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1e293b' }}>{m.name}</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>{m.email}</div>
              </div>
              <span style={{ fontSize: 11.5, fontWeight: 600, background: ROLE_BG[m.role], color: ROLE_COLOR[m.role], borderRadius: 20, padding: '2px 10px' }}>
                {m.role}
              </span>
            </div>
          ))}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

export default function Departments() {
  const [departments, setDepartments] = useState([])
  const [users, setUsers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', manager: '' })
  const [error, setError] = useState('')
  const [membersModal, setMembersModal] = useState(null)

  const load = () => Promise.all([api.get('/departments/'), api.get('/users/')]).then(([d, u]) => { setDepartments(d.data); setUsers(u.data) })
  useEffect(() => { load() }, [])

  const handleCreate = async e => {
    e.preventDefault(); setError('')
    try {
      await api.post('/departments/', { name: form.name, manager: form.manager || null })
      setShowModal(false); setForm({ name: '', manager: '' }); load()
    } catch {
      setError('Failed to create department. Name may already exist.')
    }
  }

  const handleDelete = async id => {
    if (!window.confirm('Delete this department?')) return
    await api.delete(`/departments/${id}/`); load()
  }

  const managers = users.filter(u => u.role === 'manager')

  return (
    <div className="page">
      <div className="card">
        <div className="card-header" style={{ background: 'transparent', borderBottom: '1px solid #f1f5f9', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
            <Plus size={14} /> Add Department
          </button>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Department Name</th><th>Manager</th><th>Active Members</th><th>Action</th></tr></thead>
            <tbody>
              {departments.map(d => (
                <tr key={d.id}>
                  <td><strong>{d.name}</strong></td>
                  <td>
                    {d.manager_names && d.manager_names.length > 0
                      ? d.manager_names.join(', ')
                      : <span className="text-muted">—</span>}
                  </td>
                  <td>
                    <button
                      onClick={() => setMembersModal(d)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#eef2ff', color: '#4f46e5', border: 'none', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                    >
                      <Users size={11} /> {d.member_count} members
                    </button>
                  </td>
                  <td>
                    {d.name !== 'Administration' && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(d.id)}>
                        <Trash2 size={12} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {departments.length === 0 && <div className="empty-state"><h3>No Departments Yet</h3><p>Create your first department to organise employees.</p></div>}
        </div>
      </div>

      {/* Members modal */}
      {membersModal && <MembersModal dept={membersModal} onClose={() => setMembersModal(null)} />}

      {/* Create department modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Create Department</h2></div>
            <div className="modal-body">
              {error && <div className="alert alert-error">{error}</div>}
              <form id="dept-form" onSubmit={handleCreate}>
                <div className="form-group">
                  <label className="form-label">Department Name</label>
                  <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Engineering" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Assign Manager (optional)</label>
                  <select className="form-input" value={form.manager} onChange={e => setForm({ ...form, manager: e.target.value })}>
                    <option value="">No Manager</option>
                    {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                  <div className="form-hint">Only users with Manager role appear here.</div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" form="dept-form" type="submit">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
