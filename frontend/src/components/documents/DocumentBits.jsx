import { Link } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Clock, FileText, Loader2, Star } from 'lucide-react'
import { LANGUAGES } from '@/utils/constants'
import { timeAgo } from '@/utils/format'

const STATUS = {
  pending: { label: 'En attente', tone: 'amber', icon: Clock },
  processing: { label: 'Analyse en cours', tone: 'blue', icon: Loader2 },
  ready: { label: 'Prêt', tone: 'mint', icon: CheckCircle2 },
  failed: { label: 'Échec', tone: 'coral', icon: AlertCircle },
}

export function StatusBadge({ status, progress }) {
  const s = STATUS[status] || STATUS.pending
  const Icon = s.icon
  return (
    <span className={`badge badge--${s.tone}`}>
      <Icon aria-hidden style={status === 'processing' ? { animation: 'spin 1s linear infinite' } : undefined} />
      {s.label}{status === 'processing' && progress ? ` · ${progress} %` : ''}
    </span>
  )
}

export const DocIcon = () => <span className="doc-icon"><FileText aria-hidden /></span>

export function DocumentCard({ doc }) {
  return (
    <Link to={`/app/documents/${doc.id}`} className="doc-card">
      {doc.subject && <span className="doc-card__subject" style={{ background: doc.subject.color }} aria-hidden />}
      <div className="row-between" style={{ alignItems: 'flex-start' }}>
        <StatusBadge status={doc.status} progress={doc.progress} />
        {doc.is_favorite && <Star size={16} fill="var(--highlight)" color="var(--amber)" aria-label="Favori" />}
      </div>
      <div className="doc-card__title">{doc.title || doc.original_filename}</div>
      {doc.status === 'ready' && doc.short_summary && <p className="doc-card__summary">{doc.short_summary}</p>}
      {doc.status !== 'ready' && <p className="doc-card__summary">{doc.status_message}</p>}
      <div className="doc-card__foot">
        {doc.subject && <span style={{ color: doc.subject.color, fontWeight: 500 }}>{doc.subject.name}</span>}
        {doc.page_count > 0 && <span>{doc.page_count} p.</span>}
        {doc.reading_minutes > 0 && <span>{doc.reading_minutes} min de lecture</span>}
        {doc.language && <span>{LANGUAGES[doc.language] || doc.language}</span>}
        <span style={{ marginLeft: 'auto' }}>{timeAgo(doc.last_opened_at || doc.created_at)}</span>
      </div>
    </Link>
  )
}
