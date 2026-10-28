import { AlertCircle, AlertTriangle, CheckCircle2, Info, RotateCw } from 'lucide-react'
import clsx from 'clsx'
import { Button } from './Button'

export const Spinner = ({ large }) => <span className={clsx('spinner', large && 'spinner--lg')} role="status" aria-label="Chargement" />

export const PageLoader = () => <div className="page-loader"><Spinner large /></div>

export function EmptyState({ icon: Icon = Info, title, children, action }) {
  return (
    <div className="empty">
      <div className="empty__icon"><Icon aria-hidden /></div>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  )
}

const ALERT_ICONS = { info: Info, error: AlertCircle, warn: AlertTriangle, success: CheckCircle2 }

export function Alert({ kind = 'info', title, children, action }) {
  const Icon = ALERT_ICONS[kind]
  return (
    <div className={clsx('alert', kind !== 'info' && `alert--${kind}`)} role={kind === 'error' ? 'alert' : undefined}>
      <Icon aria-hidden />
      <div className="grow">
        {title && <strong style={{ display: 'block', marginBottom: 2 }}>{title}</strong>}
        {children}
      </div>
      {action}
    </div>
  )
}

export function ErrorState({ error, onRetry }) {
  return (
    <Alert kind="error" title="Chargement impossible"
      action={onRetry && <Button variant="secondary" size="sm" icon={RotateCw} onClick={onRetry}>Réessayer</Button>}>
      {error?.message || 'Une erreur est survenue.'}
    </Alert>
  )
}

export const Skeleton = ({ height = 16, width = '100%', style }) =>
  <div className="skeleton" style={{ height, width, ...style }} aria-hidden />

export function SkeletonList({ rows = 4 }) {
  return (
    <div className="stack" style={{ '--stack': '0.75rem' }}>
      {Array.from({ length: rows }, (_, i) => <Skeleton key={i} height={56} />)}
    </div>
  )
}
