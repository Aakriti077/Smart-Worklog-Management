import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, user } = useAuth()
  const navigate = useNavigate()

  // If already logged in, redirect to appropriate dashboard
  useEffect(() => {
    if (user) {
      navigate(`/${user.role}/dashboard`, { replace: true })
    }
  }, [user, navigate])

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const u = await login(email, password)
      navigate(`/${u.role}/dashboard`, { replace: true })
    } catch {
      setError('Invalid email or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Header above card */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Welcome to</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>SmartPerform</div>
          <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>Employee Performance Evaluation System</div>
        </div>

        <div className="login-card">
          <div className="login-title">Sign in to your account</div>
          <div className="login-sub">Enter your credentials to continue</div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                className="form-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@gmail.com"
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-lg w-full"
              style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
              disabled={loading}
            >
              {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Signing in...</> : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: 20, padding: '14px 16px', background: '#f8fafc', borderRadius: 8, fontSize: 12.5, color: 'var(--text-muted)' }}>
            <strong style={{ color: 'var(--text)' }}>Note:</strong> This is an internal system. Contact your administrator for account access.
          </div>
        </div>
      </div>
    </div>
  )
}
