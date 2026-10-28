import { Link } from 'react-router-dom'

export function LogoMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <rect x="10" y="6" width="40" height="52" rx="6" fill="var(--blue)" />
      <path d="M38 6h6a6 6 0 0 1 6 6v6z" fill="var(--blue-line)" />
      <rect x="16" y="27" width="28" height="9" rx="2" fill="var(--highlight)" transform="rotate(-3 30 31)" />
      <rect x="18" y="17" width="18" height="3.5" rx="1.75" fill="var(--surface)" />
      <rect x="18" y="41" width="22" height="3.5" rx="1.75" fill="var(--surface)" opacity=".75" />
      <rect x="18" y="48" width="13" height="3.5" rx="1.75" fill="var(--surface)" opacity=".75" />
    </svg>
  )
}

export function Logo({ to = '/', size }) {
  return (
    <Link to={to} className="logo" aria-label="Folio — accueil">
      <LogoMark size={size} />
      <span>Folio</span>
    </Link>
  )
}
