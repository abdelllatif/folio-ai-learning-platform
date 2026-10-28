import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, PartyPopper } from 'lucide-react'
import { flashcardsApi, plannerApi } from '@/api'
import { Flashcard } from '@/components/flashcards/Flashcard'
import { Button, EmptyState, ErrorState, PageLoader, ProgressBar } from '@/components/ui'
import { useToast } from '@/context/ToastContext'
import { useApi } from '@/hooks/useApi'
import { usePageTitle } from '@/hooks/misc'

const GRADES = [
  { grade: 0, label: 'À revoir', hint: '10 min', key: '1' },
  { grade: 1, label: 'Difficile', hint: 'bientôt', key: '2' },
  { grade: 2, label: 'Bien', hint: 'plus tard', key: '3' },
  { grade: 3, label: 'Facile', hint: 'bien plus tard', key: '4' },
]

/** Review session for one deck (``/fiches/:id/revision``) or every due card (``/fiches/revision``). */
export function Review() {
  usePageTitle('Révision')
  const { id } = useParams()
  const toast = useToast()
  const due = useApi(() => flashcardsApi.due({ deck: id, limit: 100 }), [id])
  const [queue, setQueue] = useState([])
  const [flipped, setFlipped] = useState(false)
  const [stats, setStats] = useState({ done: 0, again: 0 })
  const [startedAt] = useState(() => new Date())

  useEffect(() => { if (due.data) setQueue(due.data) }, [due.data])
  const card = queue[0]
  const total = (due.data?.length || 0)

  const grade = useCallback(async (g) => {
    if (!card || !flipped) return
    setFlipped(false)
    // forgotten cards go to the back of today's queue
    setQueue((q) => (g === 0 ? [...q.slice(1), q[0]] : q.slice(1)))
    setStats((s) => ({ done: s.done + (g === 0 ? 0 : 1), again: s.again + (g === 0 ? 1 : 0) }))
    try { await flashcardsApi.review(card.id, g) } catch (err) { toast.error(err) }
  }, [card, flipped, toast])

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space') { e.preventDefault(); setFlipped((f) => !f) }
      const g = GRADES.find((x) => x.key === e.key)
      if (g) grade(g.grade)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [grade])

  // log the session when the queue is emptied
  useEffect(() => {
    if (total && queue.length === 0 && stats.done > 0) {
      const minutes = Math.max(1, Math.round((Date.now() - startedAt.getTime()) / 60000))
      plannerApi.logSession({ kind: 'flashcards', minutes, started_at: startedAt.toISOString() }).catch(() => {})
    }
  }, [queue.length, total, stats.done, startedAt])

  if (due.error) return <ErrorState error={due.error} onRetry={due.reload} />
  if (due.loading) return <PageLoader />
  const back = id ? `/app/fiches/${id}` : '/app/fiches'

  if (!card) {
    return (
      <div className="quiz-shell panel">
        <EmptyState icon={PartyPopper} title={total ? 'Révision terminée' : 'Rien à réviser pour l’instant'}
          action={<Button to={back}>Retour aux fiches</Button>}>
          {total ? `${stats.done} fiche${stats.done > 1 ? 's' : ''} révisée${stats.done > 1 ? 's' : ''}${stats.again ? `, ${stats.again} reprise${stats.again > 1 ? 's' : ''} en route` : ''}. Revenez demain pour la suite.` : 'Les fiches reviendront quand ce sera le bon moment.'}
        </EmptyState>
      </div>
    )
  }

  return (
    <div className="quiz-shell">
      <div className="row-between" style={{ marginBottom: '1rem' }}>
        <Link to={back} className="small row" style={{ gap: 4 }}><ArrowLeft size={15} />Quitter</Link>
        <span className="small muted">{queue.length} restante{queue.length > 1 ? 's' : ''}</span>
      </div>
      <ProgressBar value={(stats.done / Math.max(1, total)) * 100} tone="mint" label="Avancement de la révision" />
      <div style={{ marginTop: '1.5rem' }}>
        <Flashcard card={card} flipped={flipped} onFlip={() => setFlipped((f) => !f)} />
      </div>
      {flipped ? (
        <div className="grades" role="group" aria-label="Comment c’était ?">
          {GRADES.map((g) => (
            <button key={g.grade} type="button" className={`grade-btn grade-btn--${g.grade}`} onClick={() => grade(g.grade)}>
              {g.label}<small>{g.hint} · touche {g.key}</small>
            </button>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
          <Button size="lg" onClick={() => setFlipped(true)}>Voir la réponse</Button>
        </div>
      )}
    </div>
  )
}
