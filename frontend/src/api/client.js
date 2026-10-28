import axios from 'axios'

/**
 * Axios instance with JWT handling.
 * - attaches the access token
 * - on 401, refreshes once (requests made meanwhile wait for the same refresh)
 * - normalises errors to { code, message, details, status }
 */
const TOKENS_KEY = 'folio.tokens'

export const tokenStore = {
  get() {
    try { return JSON.parse(localStorage.getItem(TOKENS_KEY)) || null } catch { return null }
  },
  set(tokens) {
    try { localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens)) } catch { /* private mode */ }
  },
  clear() {
    try { localStorage.removeItem(TOKENS_KEY) } catch { /* ignore */ }
  },
}

const baseURL = `${import.meta.env.VITE_API_URL || ''}/api/v1`
export const api = axios.create({ baseURL, timeout: 120000 })

api.interceptors.request.use((config) => {
  const tokens = tokenStore.get()
  if (tokens?.access) config.headers.Authorization = `Bearer ${tokens.access}`
  return config
})

let refreshing = null
let onSessionExpired = () => {}
export const setSessionExpiredHandler = (fn) => { onSessionExpired = fn }

async function refreshAccess() {
  const tokens = tokenStore.get()
  if (!tokens?.refresh) throw new Error('no refresh token')
  const { data } = await axios.post(`${baseURL}/auth/refresh/`, { refresh: tokens.refresh })
  tokenStore.set({ access: data.access, refresh: data.refresh || tokens.refresh })
  return data.access
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const isAuthCall = original?.url?.startsWith('/auth/login') || original?.url?.startsWith('/auth/refresh')
    if (error.response?.status === 401 && original && !original._retried && !isAuthCall) {
      original._retried = true
      try {
        refreshing = refreshing || refreshAccess().finally(() => { refreshing = null })
        const access = await refreshing
        original.headers.Authorization = `Bearer ${access}`
        return api(original)
      } catch {
        tokenStore.clear()
        onSessionExpired()
      }
    }
    return Promise.reject(normalizeError(error))
  },
)

export function normalizeError(error) {
  if (error?.isNormalized) return error
  const status = error.response?.status ?? 0
  const payload = error.response?.data?.error
  const normalized = new Error(
    payload?.message ||
      (status === 0 ? 'Connexion au serveur impossible. Vérifiez votre réseau.' :
        status >= 500 ? 'Le serveur a rencontré une erreur. Réessayez dans un instant.' :
          'La requête a échoué.'),
  )
  normalized.code = payload?.code || (status === 0 ? 'network' : 'error')
  normalized.details = payload?.details || null
  normalized.status = status
  normalized.isNormalized = true
  return normalized
}

/** Turn DRF field errors into { field: 'message' } for forms. */
export function fieldErrors(error) {
  const out = {}
  const details = error?.details
  if (details && typeof details === 'object' && !Array.isArray(details)) {
    for (const [key, value] of Object.entries(details)) {
      out[key] = Array.isArray(value) ? String(value[0]) : String(value)
    }
  }
  return out
}

export const unwrap = (promise) => promise.then((r) => r.data)
