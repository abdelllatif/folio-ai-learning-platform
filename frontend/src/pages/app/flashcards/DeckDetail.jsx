import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Play, Plus, Search, Trash2 } from 'lucide-react'
import { flashcardsApi } from '@/api'
import { Button, EmptyState, ErrorState, Input, Menu, Modal, PageLoader, Textarea } from '@/components/ui'
import { useToast } from '@/context/ToastContext'
import { useApi } from '@/hooks/useApi'
import { useDebounce, usePageTitle } from '@/hooks/misc'
import { formatShortDate } from '@/utils/format'

function cardState(c) {
  if (c.interval_days >= 21) return ['Maîtrisée', 'mint']
  if (!c.last_reviewed_at) return ['Nouvelle', 'blue']
  if (new Date(c.due_at) <= new Date()) return ['À réviser', 'amber']
  return [`Le ${formatShortDate(c.due_at)}`, '']
}

export function DeckDetail() {
  const { id } = useParams()
  const toast = useToast()
  const deck = useApi(() => flashcardsApi.deck(id), [id])
  const [query, setQuery] = useState('')
  const search = useDebounce(query)
  const cards = useApi(() => flashcardsApi.cards({ deck: id, search: search || undefined, page_size: 100 }), [id, search])
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  usePageTitle(deck.data?.title)

  if (deck.error) return <ErrorState error={deck.error} onRetry={deck.reload} />
  if (deck.loading) return <PageLoader />
  const d = deck.data

  const save = async () => {
    setSaving(true)
    try {
      if (editing.id) await flashcardsApi.updateCard(editing.id, { front: editing.front, back: editing.back })
      else await flashcardsApi.createCard({ deck: Number(id), front: editing.front, back: editing.back })
      toast.success(editing.id ? 'Fiche modifiée.' : 'Fiche ajoutée.')
      setEditing(null); cards.reload(); deck.reload()
    } catch (err) { toast.error(err) } finally { setSaving(false) }
  }
  const remove = async (card) => {
    await flashcardsApi.removeCard(card.id)
    cards.reload(); deck.reload()
  }

  return (
    <>
      <Link to="/app/fiches" className="small row" style={{ gap: 4, marginBottom: '0.75rem' }}><ArrowLeft size={15} />Tous les paquets</Link>
      <div className="page-head">
        <div>
          <h1>{d.title}</h1>
          <p>{d.card_count} fiches · {d.mastered_count} maîtrisées · {d.due_count} à réviser
            {d.document && <> · <Link to={`/app/documents/${d.document}`}>{d.document_title}</Link></>}</p>
        </div>
        <div className="page-head__actions">
          <Button variant="secondary" icon={Plus} onClick={() => setEditing({ front: '', back: '' })}>Ajouter une fiche</Button>
          <Button icon={Play} to={`/app/fiches/${id}/revision`} disabled={!d.due_count}>{d.due_count ? `Réviser (${d.due_count})` : 'Rien à réviser'}</Button>
        </div>
      </div>

      <div className="toolbar"><div className="input-group"><Search aria-hidden />
        <input className="input" type="search" placeholder="Chercher une fiche…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Chercher une fiche" /></div></div>

      {cards.data?.results?.length === 0 && <div className="panel"><EmptyState title="Aucune fiche" action={<Button icon={Plus} onClick={() => setEditing({ front: '', back: '' })}>Ajouter une fiche</Button>}>{search ? 'Aucune fiche ne correspond.' : 'Ce paquet est vide.'}</EmptyState></div>}
      {cards.data?.results?.length > 0 && (
        <div className="panel panel--flush table-wrap">
          <table className="table">
            <thead><tr><th>Recto</th><th>Verso</th><th>État</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {cards.data.results.map((c) => {
                const [label, tone] = cardState(c)
                return (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 500, maxWidth: 280 }}>{c.front}</td>
                    <td className="muted" style={{ maxWidth: 420 }}>{c.back}</td>
                    <td><span className={`badge ${tone ? `badge--${tone}` : ''}`}>{label}</span></td>
                    <td><Menu items={[
                      { label: 'Modifier', icon: Pencil, onClick: () => setEditing(c) },
                      { label: 'Supprimer', icon: Trash2, danger: true, onClick: () => remove(c) },
                    ]} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing?.id ? 'Modifier la fiche' : 'Nouvelle fiche'}
        footer={<><Button variant="secondary" onClick={() => setEditing(null)}>Annuler</Button>
          <Button onClick={save} loading={saving} disabled={!editing?.front?.trim() || !editing?.back?.trim()}>Enregistrer</Button></>}>
        <div className="stack">
          <Input label="Recto (question ou terme)" value={editing?.front || ''} onChange={(e) => setEditing((x) => ({ ...x, front: e.target.value }))} />
          <Textarea label="Verso (réponse)" value={editing?.back || ''} onChange={(e) => setEditing((x) => ({ ...x, back: e.target.value }))} />
        </div>
      </Modal>
    </>
  )
}
