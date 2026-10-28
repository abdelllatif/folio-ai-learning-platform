import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { Layers, Sparkles } from 'lucide-react'
import { flashcardsApi } from '@/api'
import { DeckList } from '@/components/flashcards/DeckList'
import { Button, EmptyState, Select, SkeletonList } from '@/components/ui'
import { useToast } from '@/context/ToastContext'
import { useApi } from '@/hooks/useApi'

export function DocFlashcards() {
  const { doc } = useOutletContext()
  const toast = useToast()
  const navigate = useNavigate()
  const decks = useApi(() => flashcardsApi.decks({ document: doc.id }), [doc.id])
  const [count, setCount] = useState(20)
  const [busy, setBusy] = useState(false)

  const generate = async () => {
    setBusy(true)
    try {
      const deck = await flashcardsApi.generate(doc.id, Number(count))
      toast.success(`${deck.card_count} fiches créées.`)
      navigate(`/app/fiches/${deck.id}/revision`)
    } catch (err) { toast.error(err) } finally { setBusy(false) }
  }

  const generator = (
    <div className="row">
      <Select aria-label="Nombre de fiches" value={count} onChange={(e) => setCount(e.target.value)}
        options={[10, 20, 30, 50].map((n) => ({ value: n, label: `${n} fiches` }))} />
      <Button icon={Sparkles} onClick={generate} loading={busy}>Générer</Button>
    </div>
  )

  return (
    <div className="stack" style={{ '--stack': '1.25rem' }}>
      <div className="row-between wrap">
        <p className="muted small" style={{ margin: 0 }}>Fiches question / réponse tirées des définitions et des points clés du cours.</p>
        {decks.data?.results?.length > 0 && generator}
      </div>
      {decks.loading && <SkeletonList rows={2} />}
      {decks.data?.results?.length === 0 && (
        <div className="panel"><EmptyState icon={Layers} title="Mémorisez ce cours avec des fiches" action={generator}>
          Les fiches sont révisées par répétition espacée : chacune revient juste avant que vous ne l’oubliiez.
        </EmptyState></div>
      )}
      {decks.data?.results?.length > 0 && <DeckList decks={decks.data.results} showDocument={false} />}
    </div>
  )
}
