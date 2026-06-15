import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Topbar({ titles }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const title = titles[location.pathname] || 'Dashboard'

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'
  const firstName = user?.name?.split(' ')[0] || 'User'

  const roleAccent = {
    admin:    '#4f46e5',
    manager:  '#d97706',
    employee: '#059669',
  }
  const accent = roleAccent[user?.role] || '#4f46e5'

  return (
    <div className="topbar">
      <span className="topbar-title">{title}</span>
      <button
        onClick={() => navigate('/profile')}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '5px 10px', borderRadius: 10,
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
        onMouseLeave={e => e.currentTarget.style.background = 'none'}
      >
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          background: accent + '18',
          border: `1.5px solid ${accent}40`,
          color: accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11.5, fontWeight: 700, flexShrink: 0,
        }}>
          {initials}
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', lineHeight: 1.2 }}>{firstName}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'capitalize', lineHeight: 1.2 }}>{user?.role}</div>
        </div>
      </button>
    </div>
  )
}
