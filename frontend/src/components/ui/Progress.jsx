import clsx from 'clsx'

export function ProgressBar({ value = 0, tone, label, className }) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className={clsx('progress', tone && `progress--${tone}`, className)} role="progressbar"
      aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className="progress__bar" style={{ width: `${pct}%` }} />
    </div>
  )
}

const TONE_VAR = { mint: 'var(--mint)', amber: 'var(--amber)', coral: 'var(--coral)', blue: 'var(--blue)' }

export function ProgressRing({ value = 0, size = 64, stroke = 6, tone = 'blue', label, children }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className="ring" style={{ width: size, height: size }} role="img" aria-label={label || `${Math.round(pct)} %`}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={TONE_VAR[tone] || TONE_VAR.blue}
          strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c}
          strokeDashoffset={c - (pct / 100) * c} style={{ transition: 'stroke-dashoffset 600ms var(--ease)' }} />
      </svg>
      <span className="ring__label">{children ?? `${Math.round(pct)}%`}</span>
    </div>
  )
}
