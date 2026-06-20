import { createContext, useContext, useEffect, useState } from 'react'
import api from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [role, setRoleState] = useState(() => localStorage.getItem('role') || 'sender')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      api.get('/auth/me')
        .then(res => setUser(res.data))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  // If user loses driver profile, fall back to sender
  const effectiveRole = (role === 'driver' && !user?.driver_profile) ? 'sender' : role

  const setRole = (newRole) => {
    localStorage.setItem('role', newRole)
    setRoleState(newRole)
  }

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', data.token)
    setUser(data.user)
    return data.user
  }

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload)
    localStorage.setItem('token', data.token)
    setUser(data.user)
    return data.user
  }

  const logout = async () => {
    await api.post('/auth/logout').catch(() => {})
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    setUser(null)
    setRoleState('sender')
  }

  const refreshUser = async () => {
    const { data } = await api.get('/auth/me')
    setUser(data)
    return data
  }

  return (
    <AuthContext.Provider value={{ user, loading, role: effectiveRole, setRole, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
