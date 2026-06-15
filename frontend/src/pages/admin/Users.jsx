import { useEffect, useState } from 'react'
import { Plus, Trash2, Search, ToggleLeft, ToggleRight, Users, GitBranch, KeyRound, X, CheckCircle, AlertCircle } from 'lucide-react'
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

/* ── Org Chart ── */
function OrgChart({ users }) {
  const managers = users.filter(u => u.role === 'manager')
  const employees = users.filter(u => u.role === 'employee')

  const deptGroups = managers.reduce((acc, mgr) => {
    const deptEmployees = employees.filter(e => e.department_name && e.department_name === mgr.department_name)
    if (!acc[mgr.department_name]) acc[mgr.department_name] = { manager: mgr, employees: deptEmployees }
    return acc
  }, {})

  return (
    <div style={{ padding: '20px 24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Managers', value: managers.length, color: '#d97706', bg: '#fffbeb' },
          { label: 'Employees', value: employees.length, color: '#059669', bg: '#ecfdf5' },
          { label: 'Departments', value: Object.keys(deptGroups).length, color: '#4f46e5', bg: '#eef2ff' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {Object.entries(deptGroups).map(([deptName, { manager: mgr, employees: emps }]) => (
          <div key={deptName} style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ background: '#1e293b', padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, color: '#fff', fontSize: 13.5 }}>{deptName}</span>
              <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: '2px 10px' }}>
                {emps.length} employee{emps.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div style={{ padding: '14px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 9, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#fef3c7', color: '#d97706', fontSize: 12.5, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '2px solid #fcd34d' }}>
                  {mgr.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5, color: '#1e293b' }}>{mgr.name}</div>
                  <div style={{ fontSize: 12, color: '#92400e' }}>{mgr.email}</div>
                </div>
                <span style={{ background: '#fef3c7', color: '#d97706', border: '1px solid #fcd34d', borderRadius: 20, padding: '2px 10px', fontSize: 11.5, fontWeight: 700 }}>Manager</span>
              </div>
              {emps.length > 0 ? (
                <div style={{ paddingLeft: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                  {emps.map(emp => (
                    <div key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, opacity: emp.is_active ? 1 : 0.5 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#ecfdf5', color: '#059669', fontSize: 10.5, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: '#1e293b' }}>{emp.name}</div>
                        <div style={{ fontSize: 11, color: emp.is_active ? '#059669' : '#dc2626' }}>{emp.is_active ? 'Active' : 'Inactive'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ paddingLeft: 16, fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>No employees in this department yet</div>
              )}
            </div>
          </div>
        ))}
        {managers.filter(m => !m.department_name).map(mgr => (
          <div key={mgr.id} style={{ border: '1px dashed #e2e8f0', borderRadius: 12, padding: '14px 18px', background: '#fafafa', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#fef3c7', color: '#d97706', fontSize: 11.5, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {mgr.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{mgr.name}</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>Manager — no department assigned</div>
            </div>
          </div>
        ))}
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
  const [tab, setTab] = useState('list')
  const [toast, setToast] = useState(null)

  // Confirm toggle state: { user, action ('enable'|'disable') }
  const [confirmToggle, setConfirmToggle] = useState(null)
  const [toggleLoading, setToggleLoading] = useState(false)
  // Reset password modal
  const [resetUser, setResetUser] = useState(null)
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
    } catch { showToast('error', 'Delete failed.') }
    finally { setDeleteLoading(false) }
  }

  const filtered = users.filter(u => {
    const ms = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    const mr = !roleFilter || u.role === roleFilter
    return ms && mr
  })

  const roleColor = { admin: '#4f46e5', manager: '#d97706', employee: '#059669' }

  return (
    <div className="page">
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 3000, background: toast.type === 'success' ? '#ecfdf5' : '#fef2f2', border: `1px solid ${toast.type === 'success' ? '#bbf7d0' : '#fecaca'}`, color: toast.type === 'success' ? '#065f46' : '#dc2626', borderRadius: 10, padding: '12px 18px', fontSize: 13.5, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', gap: 8 }}>
          {toast.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}{toast.text}
        </div>
      )}

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {[{ key: 'list', label: 'User List', icon: Users }, { key: 'org', label: 'Org Structure', icon: GitBranch }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '7px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13.5,
            background: tab === t.key ? '#eef2ff' : '#fff', color: tab === t.key ? '#4f46e5' : '#64748b',
            boxShadow: tab === t.key ? '0 0 0 2px #818cf840' : '0 1px 3px rgba(0,0,0,0.07)',
          }}>
            <t.icon size={14} />{t.label}
          </button>
        ))}
      </div>

      {tab === 'org' ? (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '14px 22px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14.5, color: '#1e293b' }}>Organisation Structure</div>
              <div style={{ fontSize: 12.5, color: '#94a3b8', marginTop: 1 }}>Manager → Employee department hierarchy</div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}><Plus size={13} /> Add User</button>
          </div>
          <OrgChart users={users} />
        </div>
      ) : (
        <div className="card">
          <div className="card-header" style={{ flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Search size={14} color="#94a3b8" />
              <input className="form-input" style={{ border: 'none', padding: '4px 0', outline: 'none', width: 200 }} placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
              <select className="form-input" style={{ width: 130, padding: '5px 10px' }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                <option value="">All Roles</option>
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
              <span style={{ fontSize: 12.5, color: '#94a3b8' }}>{filtered.length} users</span>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}><Plus size={13} /> Add User</button>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} style={{ opacity: u.is_active ? 1 : 0.6 }}>
                    <td>
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
        </div>
      )}

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
                      <option value="admin">Admin</option>
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
