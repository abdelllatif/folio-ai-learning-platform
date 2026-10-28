import { Link } from 'react-router-dom'
import { Pencil, Pin, Trash2 } from 'lucide-react'
import { Menu } from '@/components/ui'
import { timeAgo } from '@/utils/format'

export function NoteGrid({ notes, onEdit, onDelete, onTogglePin, showDocument = true }) {
  return (
    <div className="notes-grid">
      {notes.map((n) => (
        <article key={n.id} className={`note note--${n.color}`}>
          <div className="row-between" style={{ alignItems: 'flex-start' }}>
            <h4>{n.is_pinned && '📌 '}{n.title || (n.quote ? 'Passage gardé' : 'Note')}</h4>
            <Menu items={[
              { label: 'Modifier', icon: Pencil, onClick: () => onEdit(n) },
              { label: n.is_pinned ? 'Désépingler' : 'Épingler', icon: Pin, onClick: () => onTogglePin(n) },
              { label: 'Supprimer', icon: Trash2, danger: true, onClick: () => onDelete(n) },
            ]} />
          </div>
          {n.quote && <blockquote>{n.quote.length > 400 ? `${n.quote.slice(0, 400)}…` : n.quote}</blockquote>}
          {n.content && <p>{n.content}</p>}
          {n.tags?.length > 0 && <div className="row wrap" style={{ gap: 4, marginBottom: 6 }}>{n.tags.map((t) => <span key={t} className="badge">#{t}</span>)}</div>}
          <div className="tiny muted">
            {showDocument && n.document && <><Link to={`/app/documents/${n.document}${n.page ? `/texte?page=${n.page}` : ''}`}>{n.document_title}</Link> · </>}
            {!showDocument && n.page && <><Link to={`/app/documents/${n.document}/texte?page=${n.page}`}>p. {n.page}</Link> · </>}
            {timeAgo(n.updated_at)}
          </div>
        </article>
      ))}
    </div>
  )
}
