// AuthContext — manages login state across the entire app
import { createContext, useContext, useState } from 'react'
import api from '../api/axios'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const u = sessionStorage.getItem('user')
      return u ? JSON.parse(u) : null
    } catch {
      return null
    }
  })

  const login = async (email, password) => {
    const res = await api.post('/auth/login/', { email, password })
    const { access, refresh, user: userData } = res.data
    sessionStorage.setItem('access', access)
    sessionStorage.setItem('refresh', refresh)
    sessionStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }

  const updateUser = (patch) => {
    const updated = { ...user, ...patch }
    sessionStorage.setItem('user', JSON.stringify(updated))
    setUser(updated)
  }

  const logout = () => {
    sessionStorage.clear()
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
