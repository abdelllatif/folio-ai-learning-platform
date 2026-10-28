import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layers, Play, Plus, Sparkles } from 'lucide-react'
import { documentsApi, flashcardsApi } from '@/api'
import { DeckList } from '@/components/flashcards/DeckList'
import { Alert, Button, ConfirmDialog, EmptyState, ErrorState, Input, Modal, Select, SkeletonList } from '@/components/ui'
import { useToast } from '@/context/ToastContext'
import { useApi } from '@/hooks/useApi'
import { usePageTitle } from '@/hooks/misc'

export function Decks() {
  usePageTitle('Fiches de révision')
  const toast = useToast()
  const navigate = useNavigate()
  const decks = useApi(() => flashcardsApi.decks({ page_size: 100 }), [])
  const docs = useApi(() => documentsApi.list({ status: 'ready', page_size: 100 }), [])
  const [modal, setModal] = useState(null) // 'generate' | 'create'
  const [form, setForm] = useState({ document: '', count: 20, title: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [toDelete, setToDelete] = useState(null)

  const totalDue = (decks.data?.results || []).reduce((n, d) => n + d.due_count, 0)

  const submit = async () => {
    setBusy(true); setError(null)
    try {
      const deck = modal === 'generate'
        ? await flashcardsApi.generate(Number(form.document), Number(form.count))
        : await flashcardsApi.createDeck({ title: form.title, document: form.document || null })
      toast.success(modal === 'generate' ? `${deck.card_count} fiches créées.` : 'Paquet créé.')
      navigate(`/app/fiches/${deck.id}`)
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  const remove = async () => {
    await flashcardsApi.removeDeck(toDelete.id)
    setToDelete(null); decks.reload(); toast.success('Paquet supprimé.')
  }
  const docOptions = (docs.data?.results || []).map((d) => ({ value: d.id, label: d.title }))

  return (
    <>
      <div className="page-head">
        <div><h1>Fiches de révision</h1><p>Chaque fiche revient au moment où vous risquez de l’oublier.</p></div>
        <div className="page-head__actions">
          <Button variant="secondary" icon={Plus} onClick={() => { setForm({ document: '', count: 20, title: '' }); setModal('create') }}>Paquet vide</Button>
          <Button icon={Sparkles} onClick={() => { setForm({ document: '', count: 20, title: '' }); setModal('generate') }} disabled={!docOptions.length}>Générer depuis un document</Button>
        </div>
      </div>

      {totalDue > 0 && (
        <div className="panel row-between" style={{ background: 'var(--highlight-soft)', borderColor: 'transparent', marginBottom: '1.25rem' }}>
          <div><strong>{totalDue} fiche{totalDue > 1 ? 's' : ''} à réviser aujourd’hui</strong><div className="small muted">Tous paquets confondus.</div></div>
          <Button icon={Play} to="/app/fiches/revision">Tout réviser</Button>
        </div>
      )}

      {decks.error && <ErrorState error={decks.error} onRetry={decks.reload} />}
      {decks.loading && <SkeletonList />}
      {decks.data?.results?.length === 0 && (
        <div className="panel">
          <EmptyState icon={Layers} title="Aucun paquet de fiches"
            action={docOptions.length ? <Button icon={Sparkles} onClick={() => setModal('generate')}>Générer mes premières fiches</Button> : <Button to="/app/bibliotheque">Déposer un document</Button>}>
            Folio peut créer des fiches à partir des définitions et des points clés d’un document.
          </EmptyState>
        </div>
      )}
      {decks.data?.results?.length > 0 && <DeckList decks={decks.data.results} onDelete={setToDelete} />}

      <Modal open={Boolean(modal)} onClose={() => setModal(null)} title={modal === 'generate' ? 'Générer des fiches' : 'Nouveau paquet'}
        footer={<><Button variant="secondary" onClick={() => setModal(null)}>Annuler</Button>
          <Button onClick={submit} loading={busy} disabled={modal === 'generate' ? !form.document : !form.title.trim()}>{modal === 'generate' ? 'Générer' : 'Créer'}</Button></>}>
        <div className="stack">
          {error && <Alert kind="error">{error}</Alert>}
          {modal === 'create' && <Input label="Nom du paquet" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="ex. Dates d’histoire" />}
          <Select label={modal === 'generate' ? 'Document' : 'Document lié (facultatif)'} placeholder="Choisir" value={form.document}
            onChange={(e) => setForm({ ...form, document: e.target.value })} options={docOptions} />
          {modal === 'generate' && <Select label="Nombre de fiches" value={form.count} onChange={(e) => setForm({ ...form, count: e.target.value })}
            options={[10, 20, 30, 50].map((n) => ({ value: n, label: `${n} fiches` }))} />}
        </div>
      </Modal>
      <ConfirmDialog open={Boolean(toDelete)} onClose={() => setToDelete(null)} onConfirm={remove}
        title="Supprimer ce paquet ?" message={`« ${toDelete?.title} » et ses ${toDelete?.card_count} fiches seront supprimés.`} />
    </>
  )
}
