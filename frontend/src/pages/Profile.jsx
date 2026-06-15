import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Lock, CheckCircle, Shield, Mail, Briefcase, User, Pencil, X, Check } from 'lucide-react'
import api from '../api/axios'

export default function Profile() {
  const { user, updateUser } = useAuth()
  const [form, setForm] = useState({ old_password: '', new_password: '', confirm_password: '' })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)


  // Name editing state
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(user?.name || '')
  const [nameSaving, setNameSaving] = useState(false)
  const [nameMsg, setNameMsg] = useState(null)

  const handleSaveName = async () => {
    const trimmed = nameValue.trim()
    if (!trimmed) { setNameMsg({ type: 'error', text: 'Name cannot be empty.' }); return }
    if (trimmed === user?.name) { setEditingName(false); return }
    setNameSaving(true); setNameMsg(null)
    try {
      const res = await api.patch('/users/me/name/', { name: trimmed })
      updateUser({ name: res.data.name })
      setEditingName(false)
      setNameMsg({ type: 'success', text: 'Name updated successfully.' })
      setTimeout(() => setNameMsg(null), 3000)
    } catch (err) {
      setNameMsg({ type: 'error', text: err.response?.data?.error || 'Failed to update name.' })
    } finally { setNameSaving(false) }
  }

  const cancelEdit = () => { setNameValue(user?.name || ''); setEditingName(false); setNameMsg(null) }

  const handleChangePassword = async e => {
    e.preventDefault()
    setMsg(null)
    if (form.new_password !== form.confirm_password) {
      setMsg({ type: 'error', text: 'New passwords do not match.' })
      return
    }
    if (form.new_password.length < 6) {
      setMsg({ type: 'error', text: 'New password must be at least 6 characters.' })
      return
    }
    setLoading(true)
    try {
      await api.post('/users/change-password/', {
        old_password: form.old_password,
        new_password: form.new_password,
      })
      setMsg({ type: 'success', text: 'Password changed successfully.' })
      setForm({ old_password: '', new_password: '', confirm_password: '' })
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Failed to change password.' })
    } finally {
      setLoading(false)
    }
  }

  const initials = (user?.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const roleGrad = {
    admin:    'linear-gradient(135deg,#4f46e5,#7c3aed)',
    manager:  'linear-gradient(135deg,#d97706,#f59e0b)',
    employee: 'linear-gradient(135deg,#059669,#10b981)',
  }

  return (
    <div className="page">
      {/* ── Hero banner ── */}
      <div style={{
        background: roleGrad[user?.role] || roleGrad.employee,
        borderRadius: 16,
        padding: '32px 36px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', right: -30, top: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: 80, bottom: -40, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />

        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'rgba(255,255,255,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, fontWeight: 800, color: '#fff', flexShrink: 0,
          border: '3px solid rgba(255,255,255,0.4)',
        }}>
          {initials}
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>{user?.name}</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 3 }}>{user?.email}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>
              {user?.role}
            </span>
            {user?.department_name && (
              <span style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.85)', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 500 }}>
                {user.department_name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Two column: info + password ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Account info */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <User size={15} color="var(--primary)" />
              <div className="card-title">Account Information</div>
            </div>
          </div>
          <div className="card-body">
            {/* Full Name — editable */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User size={15} color="var(--primary)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11.5, color: '#94a3b8', fontWeight: 500, marginBottom: 4 }}>Full Name</div>
                {editingName ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      className="form-input"
                      style={{ padding: '5px 10px', fontSize: 13.5, flex: 1 }}
                      value={nameValue}
                      onChange={e => setNameValue(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') cancelEdit() }}
                      autoFocus
                    />
                    <button onClick={handleSaveName} disabled={nameSaving} style={{ background: '#ecfdf5', border: 'none', borderRadius: 7, padding: '5px 8px', cursor: 'pointer', color: '#059669' }} title="Save">
                      <Check size={14} />
                    </button>
                    <button onClick={cancelEdit} style={{ background: '#f1f5f9', border: 'none', borderRadius: 7, padding: '5px 8px', cursor: 'pointer', color: '#64748b' }} title="Cancel">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{user?.name}</span>
                    <button onClick={() => { setNameValue(user?.name || ''); setEditingName(true) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2, display: 'flex', alignItems: 'center' }} title="Edit name">
                      <Pencil size={13} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {nameMsg && (
              <div className={`alert alert-${nameMsg.type === 'success' ? 'success' : 'error'}`} style={{ marginTop: 8, marginBottom: 0 }}>
                {nameMsg.type === 'success' && <CheckCircle size={13} />}{nameMsg.text}
              </div>
            )}

            {/* Other read-only fields */}
            {[
              { icon: Mail,      label: 'Email',      value: user?.email },
              { icon: Shield,    label: 'Role',       value: user?.role,              capitalize: true },
              { icon: Briefcase, label: 'Department', value: user?.department_name || 'Not assigned' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <row.icon size={15} color="var(--primary)" />
                </div>
                <div>
                  <div style={{ fontSize: 11.5, color: '#94a3b8', fontWeight: 500, marginBottom: 2 }}>{row.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', textTransform: row.capitalize ? 'capitalize' : 'none' }}>{row.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Change password */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Lock size={15} color="var(--primary)" />
              <div className="card-title">Change Password</div>
            </div>
          </div>
          <div className="card-body">
            {msg && (
              <div className={`alert alert-${msg.type === 'success' ? 'success' : 'error'}`}>
                {msg.type === 'success' && <CheckCircle size={15} />}
                {msg.text}
              </div>
            )}
            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input
                  className="form-input"
                  type="password"
                  value={form.old_password}
                  onChange={e => setForm({ ...form, old_password: e.target.value })}
                  placeholder="Enter your current password"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  className="form-input"
                  type="password"
                  value={form.new_password}
                  onChange={e => setForm({ ...form, new_password: e.target.value })}
                  placeholder="At least 6 characters"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  className="form-input"
                  type="password"
                  value={form.confirm_password}
                  onChange={e => setForm({ ...form, confirm_password: e.target.value })}
                  placeholder="Repeat new password"
                  required
                />
                {form.new_password && form.confirm_password && form.new_password !== form.confirm_password && (
                  <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>Passwords do not match</div>
                )}
              </div>

              {/* Password strength hints */}
              {form.new_password && (
                <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
                  {[
                    { label: 'At least 6 characters', ok: form.new_password.length >= 6 },
                    { label: 'Contains a number',     ok: /\d/.test(form.new_password) },
                    { label: 'Contains a letter',     ok: /[a-zA-Z]/.test(form.new_password) },
                  ].map(hint => (
                    <div key={hint.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: hint.ok ? '#059669' : '#94a3b8', marginBottom: 4 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: hint.ok ? '#059669' : '#cbd5e1', flexShrink: 0 }} />
                      {hint.label}
                    </div>
                  ))}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={loading || (form.new_password && form.confirm_password && form.new_password !== form.confirm_password)}
              >
                {loading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Changing...</> : 'Change Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
