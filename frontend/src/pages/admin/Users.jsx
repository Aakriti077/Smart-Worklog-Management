import { useEffect, useState } from 'react'
import { Plus, Trash2, Search, ToggleLeft, ToggleRight, KeyRound, X, CheckCircle, AlertCircle, Pencil } from 'lucide-react'
import api from '../../api/axios'

/* ── Small in-app confirmation/modal helper ── */
function ConfirmModal({ title, message, confirmLabel, confirmColor = '#dc2626', onConfirm, onCancel, loading }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 380, boxShadow: '0 24px 64px rgba(15,23,42,0.18)', padding: '28px 28px 22px' }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: '#1e293b', marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.6, marginBottom: 22 }}>{message}</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary btn-sm" onClick={onCancel} disabled={loading}>Cancel</button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{ background: confirmColor, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 13.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}
          >
            {loading ? <><span className="spinner" style={{ width: 12, height: 12, borderTopColor: '#fff' }} />Working...</> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Reset Password Modal ── */
function ResetPasswordModal({ user, onClose, onDone }) {
  const [pass, setPass] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async e => {
    e.preventDefault()
    if (pass.length < 6) { setError('Password must be at least 6 characters.'); return }
    setSaving(true); setError('')
    try {
      await api.post(`/users/${user.id}/reset-password/`, { new_password: pass })
      onDone(`Password for ${user.name} reset successfully.`)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password.')
    } finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 420, boxShadow: '0 24px 64px rgba(15,23,42,0.18)' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>Reset Password</div>
            <div style={{ fontSize: 12.5, color: '#94a3b8', marginTop: 2 }}>for {user.name} ({user.email})</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={17} /></button>
        </div>
        <form onSubmit={submit} style={{ padding: '20px 22px' }}>
          {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#dc2626', display: 'flex', gap: 8, alignItems: 'center' }}><AlertCircle size={13} />{error}</div>}
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input className="form-input" type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="Minimum 6 characters" autoFocus required />
            {pass.length > 0 && pass.length < 6 && <div style={{ fontSize: 12, color: '#d97706', marginTop: 4 }}>Too short</div>}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving || pass.length < 6}>
              {saving ? <><span className="spinner" style={{ width: 12, height: 12 }} />Resetting...</> : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


/* ── Edit User Modal ── */
function EditUserModal({ user, departments, onClose, onSaved }) {
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [role, setRole] = useState(user.role)
  const [department, setDepartment] = useState(user.department || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async e => {
    e.preventDefault()
    if (!name.trim()) return setError('Name cannot be empty.')
    if (!email.trim() || !email.includes('@')) return setError('Enter a valid email address.')
    setSaving(true); setError('')
    try {
      await api.put(`/users/${user.id}/`, { name: name.trim(), email: email.trim(), role, department: department || null })
      onSaved()
    } catch (err) {
      setError(err?.response?.data?.email?.[0] || err?.response?.data?.name?.[0] || 'Failed to save changes.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 420, boxShadow: '0 24px 64px rgba(15,23,42,0.18)' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>Edit User</div>
            <div style={{ fontSize: 12.5, color: '#94a3b8', marginTop: 2 }}>{user.name} · {user.email}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={18} /></button>
        </div>
        <form onSubmit={submit} style={{ padding: '20px 24px' }}>
          {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#dc2626' }}>{error}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input className="form-input" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-input" value={role} onChange={e => setRole(e.target.value)}>
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <select className="form-input" value={department} onChange={e => setDepartment(e.target.value)}>
                <option value="">No Department</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? <><span className="spinner" style={{ width: 12, height: 12 }} />Saving...</> : 'Save Changes'}
            </button>
          </div>
        </form>
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
        {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
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

/* ── Main component ── */
export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [departments, setDepartments] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'employee', department: '' })
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [toast, setToast] = useState(null)
  const [page, setPage] = useState(1)

  // Confirm toggle state: { user, action ('enable'|'disable') }
  const [confirmToggle, setConfirmToggle] = useState(null)
  const [toggleLoading, setToggleLoading] = useState(false)
  // Reset password modal
  const [resetUser, setResetUser] = useState(null)
  // Edit user modal
  const [editUser, setEditUser] = useState(null)
  // Delete confirm
  const [deleteUser, setDeleteUser] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const load = () =>
    Promise.all([api.get('/users/'), api.get('/departments/')]).then(([u, d]) => {
      setUsers(u.data); setDepartments(d.data)
    })

  useEffect(() => { load() }, [])

  const showToast = (type, text) => { setToast({ type, text }); setTimeout(() => setToast(null), 3500) }

  const handleCreate = async e => {
    e.preventDefault(); setFormError(''); setFormLoading(true)
    try {
      await api.post('/users/', { ...form, department: form.department || null })
      setShowCreate(false)
      setForm({ name: '', email: '', password: '', role: 'employee', department: '' })
      load()
      showToast('success', 'User created successfully.')
    } catch (err) {
      setFormError(err.response?.data?.email?.[0] || 'Failed to create user.')
    } finally { setFormLoading(false) }
  }

  const handleToggle = async () => {
    if (!confirmToggle) return
    setToggleLoading(true)
    try {
      await api.post(`/users/${confirmToggle.user.id}/toggle-active/`)
      setConfirmToggle(null)
      load()
      showToast('success', `${confirmToggle.user.name} ${confirmToggle.action === 'enable' ? 'enabled' : 'disabled'} successfully.`)
    } catch { showToast('error', 'Action failed.') }
    finally { setToggleLoading(false) }
  }

  const handleDelete = async () => {
    if (!deleteUser) return
    setDeleteLoading(true)
    try {
      await api.delete(`/users/${deleteUser.id}/`)
      setDeleteUser(null)
      load()
      showToast('success', `${deleteUser.name} deleted.`)
    } catch (err) { showToast('error', err.response?.data?.error || 'Delete failed.') }
    finally { setDeleteLoading(false) }
  }

  const filtered = users.filter(u => {
    if (u.role === 'admin') return false
    const ms = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    const mr = !roleFilter || u.role === roleFilter
    return ms && mr
  })

  useEffect(() => setPage(1), [search, roleFilter])

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const roleColor = { admin: '#4f46e5', manager: '#d97706', employee: '#059669' }

  return (
    <div className="page">
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 3000, background: toast.type === 'success' ? '#ecfdf5' : '#fef2f2', border: `1px solid ${toast.type === 'success' ? '#bbf7d0' : '#fecaca'}`, color: toast.type === 'success' ? '#065f46' : '#dc2626', borderRadius: 10, padding: '12px 18px', fontSize: 13.5, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', gap: 8 }}>
          {toast.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}{toast.text}
        </div>
      )}

      <div className="card">
          <div className="card-header" style={{ padding: '16px 24px', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 12px', background: '#fff' }}>
                <Search size={14} color="#94a3b8" />
                <input style={{ border: 'none', outline: 'none', fontSize: 13.5, width: 190, color: '#1e293b', background: 'transparent' }} placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select className="form-input" style={{ width: 130, padding: '7px 10px', fontSize: 13.5 }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                <option value="">All Roles</option>
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
              </select>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}><Plus size={13} /> Add User</button>
          </div>
          <div className="table-wrap" style={{ minHeight: 580 }}>
            <table className="table">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {paged.map(u => (
                  <tr key={u.id} style={{ opacity: u.is_active ? 1 : 0.6 }}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: (roleColor[u.role] || '#4f46e5') + '15', color: roleColor[u.role] || '#4f46e5', fontSize: 10.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <strong style={{ fontSize: 13.5 }}>{u.name}</strong>
                      </div>
                    </td>
                    <td style={{ color: '#64748b', fontSize: 13 }}>{u.email}</td>
                    <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                    <td style={{ color: '#64748b', fontSize: 13 }}>{u.department_name || <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                    <td>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        background: u.is_active ? '#ecfdf5' : '#f1f5f9',
                        color: u.is_active ? '#059669' : '#94a3b8',
                        borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600,
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: u.is_active ? '#059669' : '#cbd5e1' }} />
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ color: '#94a3b8', fontSize: 12.5 }}>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 5 }}>
                        {/* Enable / Disable */}
                        <button
                          onClick={() => setConfirmToggle({ user: u, action: u.is_active ? 'disable' : 'enable' })}
                          title={u.is_active ? 'Disable account' : 'Enable account'}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            background: u.is_active ? '#f1f5f9' : '#ecfdf5',
                            color: u.is_active ? '#64748b' : '#059669',
                            border: 'none', borderRadius: 7, padding: '5px 10px',
                            fontSize: 12, fontWeight: 600, cursor: 'pointer',
                          }}
                        >
                          {u.is_active ? <><ToggleRight size={13} />Disable</> : <><ToggleLeft size={13} />Enable</>}
                        </button>
                        {/* Edit role/department — not available for admin accounts */}
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => setEditUser(u)}
                            title="Edit user"
                            style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#f0fdf4', color: '#059669', border: 'none', borderRadius: 7, padding: '5px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                          >
                            <Pencil size={12} />Edit
                          </button>
                        )}
                        {/* Reset password */}
                        <button
                          onClick={() => setResetUser(u)}
                          title="Reset password"
                          style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#eef2ff', color: '#4f46e5', border: 'none', borderRadius: 7, padding: '5px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                        >
                          <KeyRound size={12} />Pass
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => setDeleteUser(u)}
                          title="Delete user"
                          style={{ display: 'flex', alignItems: 'center', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 7, padding: '5px 8px', cursor: 'pointer' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="empty-state"><h3>No Users Found</h3></div>}
          </div>
          <Pagination page={page} total={filtered.length} onChange={setPage} />
        </div>

      {/* Create user modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New User</h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Add a new employee, manager, or admin account</p>
            </div>
            <div className="modal-body">
              {formError && <div className="alert alert-error">{formError}</div>}
              <form id="create-form" onSubmit={handleCreate}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="John Smith" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input className="form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="john@company.com" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Initial Password</label>
                  <input className="form-input" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min 6 characters" required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <select className="form-input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <select className="form-input" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>
                      <option value="">None</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" form="create-form" type="submit" disabled={formLoading}>{formLoading ? 'Creating...' : 'Create User'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Enable / Disable confirm modal */}
      {confirmToggle && (
        <ConfirmModal
          title={confirmToggle.action === 'disable' ? 'Disable Account' : 'Enable Account'}
          message={confirmToggle.action === 'disable'
            ? `This will prevent ${confirmToggle.user.name} from logging in. You can re-enable the account at any time.`
            : `This will allow ${confirmToggle.user.name} to log in again.`}
          confirmLabel={confirmToggle.action === 'disable' ? 'Disable' : 'Enable'}
          confirmColor={confirmToggle.action === 'disable' ? '#dc2626' : '#059669'}
          loading={toggleLoading}
          onConfirm={handleToggle}
          onCancel={() => setConfirmToggle(null)}
        />
      )}

      {/* Edit user modal */}
      {editUser && (
        <EditUserModal
          user={editUser}
          departments={departments}
          onClose={() => setEditUser(null)}
          onSaved={() => { setEditUser(null); load(); showToast('success', 'User updated successfully.') }}
        />
      )}

      {/* Reset password modal */}
      {resetUser && (
        <ResetPasswordModal
          user={resetUser}
          onClose={() => setResetUser(null)}
          onDone={msg => { setResetUser(null); showToast('success', msg) }}
        />
      )}

      {/* Delete confirm modal */}
      {deleteUser && (
        <ConfirmModal
          title="Delete User"
          message={`Permanently delete ${deleteUser.name}? All their work logs and KPI data will also be deleted. This cannot be undone.`}
          confirmLabel="Delete"
          confirmColor="#dc2626"
          loading={deleteLoading}
          onConfirm={handleDelete}
          onCancel={() => setDeleteUser(null)}
        />
      )}
    </div>
  )
}
