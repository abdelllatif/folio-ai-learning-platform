import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'

const ToastContext = createContext(null)
const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info }

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const push = useCallback((message, kind = 'info', duration = 4200) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((t) => [...t.slice(-3), { id, message, kind }])
    window.setTimeout(() => dismiss(id), duration)
  }, [dismiss])

  const api = useMemo(() => ({
    success: (m) => push(m, 'success'),
    error: (m) => push(typeof m === 'string' ? m : m?.message || 'Une erreur est survenue.', 'error', 6000),
    info: (m) => push(m, 'info'),
  }), [push])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map(({ id, message, kind }) => {
          const Icon = ICONS[kind]
          return (
            <div key={id} className={`toast toast--${kind}`}>
              <Icon aria-hidden />
              <span className="grow">{message}</span>
              <button className="btn btn--ghost btn--icon btn--sm" style={{ color: 'inherit', height: 22, width: 22 }}
                onClick={() => dismiss(id)} aria-label="Fermer"><X /></button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
