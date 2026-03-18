import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Restore session from localStorage
    const stored = localStorage.getItem('dairy_user')
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        localStorage.removeItem('dairy_user')
      }
    }
    setLoading(false)
  }, [])

  const login = (userData) => {
    localStorage.setItem('dairy_user', JSON.stringify(userData))
    setUser(userData)
  }

  const signup = (userData) => {
    localStorage.setItem('dairy_user', JSON.stringify(userData))
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('dairy_user')
    setUser(null)
  }

  const updateUser = (updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates }
      localStorage.setItem('dairy_user', JSON.stringify(updated))
      return updated
    })
  }

  const isAdmin = user?.role === 'admin'
  const isCustomer = user?.role === 'customer'
  const isAgent = user?.role === 'agent'

  // Multi-tenancy: admin's own doc ID is their adminId.
  // Customers/agents inherit adminId from the admin who created them.
  const adminId = isAdmin ? user?.id : user?.adminId || null

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, updateUser, isAdmin, isCustomer, isAgent, adminId, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

