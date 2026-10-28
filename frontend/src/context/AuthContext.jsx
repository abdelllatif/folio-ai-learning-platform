import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authApi } from '@/api'
import { setSessionExpiredHandler, tokenStore } from '@/api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading') // loading | authenticated | anonymous

  const finish = useCallback((data) => {
    tokenStore.set({ access: data.access, refresh: data.refresh })
    setUser(data.user)
    setStatus('authenticated')
    return data.user
  }, [])

  const signOutLocally = useCallback(() => {
    tokenStore.clear()
    setUser(null)
    setStatus('anonymous')
  }, [])

  useEffect(() => {
    setSessionExpiredHandler(signOutLocally)
    if (!tokenStore.get()?.access) {
      setStatus('anonymous')
      return
    }
    authApi.me().then((me) => { setUser(me); setStatus('authenticated') }).catch(signOutLocally)
  }, [signOutLocally])

  const value = useMemo(() => ({
    user,
    status,
    isAuthenticated: status === 'authenticated',
    login: async (email, password) => finish(await authApi.login(email, password)),
    register: async (payload) => finish(await authApi.register(payload)),
    logout: async () => {
      const refresh = tokenStore.get()?.refresh
      try { if (refresh) await authApi.logout(refresh) } finally { signOutLocally() }
    },
    refreshUser: async () => { const me = await authApi.me(); setUser(me); return me },
    setUser,
  }), [user, status, finish, signOutLocally])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
