import { Link } from 'react-router-dom'
import { Layers, Play, Trash2 } from 'lucide-react'
import { Button, Menu, ProgressBar } from '@/components/ui'

export function DeckList({ decks, onDelete, showDocument = true }) {
  return (
    <div className="panel panel--flush divider-list">
      {decks.map((d) => {
        const mastery = d.card_count ? Math.round((100 * d.mastered_count) / d.card_count) : 0
        return (
          <div key={d.id} className="row" style={{ padding: '0.9rem 1.1rem', gap: '1rem' }}>
            <span className="doc-icon" style={{ background: 'var(--highlight-soft)', borderColor: 'transparent', color: 'var(--amber)' }}><Layers aria-hidden /></span>
            <div className="grow">
              <Link to={`/app/fiches/${d.id}`} style={{ fontWeight: 500, color: 'var(--ink)' }} className="truncate">{d.title}</Link>
              <div className="tiny muted">
                {d.card_count} fiches · {d.mastered_count} maîtrisées
                {showDocument && d.document_title ? ` · ${d.document_title}` : ''}
              </div>
              <ProgressBar value={mastery} tone="mint" label="Fiches maîtrisées" className="" />
            </div>
            {d.due_count > 0 ? (
              <Button to={`/app/fiches/${d.id}/revision`} size="sm" icon={Play}>Réviser {d.due_count}</Button>
            ) : <span className="badge badge--mint">À jour</span>}
            {onDelete && <Menu items={[{ label: 'Supprimer le paquet', icon: Trash2, danger: true, onClick: () => onDelete(d) }]} />}
          </div>
        )
      })}
    </div>
  )
}
