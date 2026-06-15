import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import api from '../../api/axios'

export default function Departments() {
  const [departments, setDepartments] = useState([])
  const [users, setUsers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', manager: '' })
  const [error, setError] = useState('')

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
        <div className="card-header">
          <div>
            <div className="card-title">Departments</div>
            <div className="card-subtitle">{departments.length} departments</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
            <Plus size={14} /> Add Department
          </button>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Department Name</th><th>Manager</th><th>Members</th><th>Action</th></tr></thead>
            <tbody>
              {departments.map(d => (
                <tr key={d.id}>
                  <td><strong>{d.name}</strong></td>
                  <td>{d.manager_name || <span className="text-muted">—</span>}</td>
                  <td><span className="badge badge-blue">{d.member_count} members</span></td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(d.id)}>
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {departments.length === 0 && <div className="empty-state"><h3>No Departments Yet</h3><p>Create your first department to organise employees.</p></div>}
        </div>
      </div>

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
