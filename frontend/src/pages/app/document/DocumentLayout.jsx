import { useEffect, useState } from 'react'
import { Outlet, useNavigate, useParams } from 'react-router-dom'
import {
  AlertCircle, BookOpenText, CheckCircle2, Circle, ExternalLink, FileQuestion, FileText, Layers,
  Lightbulb, ListChecks, Loader2, MessagesSquare, NotebookPen, Pencil, RefreshCw, Sparkles, Star,
  Trash2,
} from 'lucide-react'
import { documentsApi, subjectsApi } from '@/api'
import { StatusBadge } from '@/components/documents/DocumentBits'
import { notifyDocumentsChanged } from '@/components/documents/UploadModal'
import {
  Alert, Button, ConfirmDialog, ErrorState, Input, Menu, Modal, PageLoader, ProgressBar, RouteTabs, Select,
} from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { useApi } from '@/hooks/useApi'
import { useInterval, usePageTitle } from '@/hooks/misc'
import { LANGUAGES } from '@/utils/constants'

const STEPS = [
  [5, 'Lecture du PDF et reconnaissance des pages scannées'],
  [30, 'Découpage du contenu en passages'],
  [45, 'Indexation pour la recherche et l’assistant'],
  [65, 'Rédaction du résumé, de l’explication et du glossaire'],
  [100, 'Document prêt'],
]

function Processing({ doc }) {
  return (
    <div className="panel processing-card">
      <Sparkles size={30} color="var(--blue)" style={{ margin: '0 auto 0.75rem' }} aria-hidden />
      <h2 style={{ fontSize: 'var(--fs-lg)' }}>Folio lit votre document</h2>
      <p className="muted small">Vous pouvez quitter cette page : l’analyse continue et le document passera à « Prêt ».</p>
      <ProgressBar value={doc.progress} label="Progression de l’analyse" />
      <ul className="processing-steps">
        {STEPS.map(([threshold, label], i) => {
          const next = STEPS[i + 1]?.[0] ?? 101
          const done = doc.progress >= next || doc.progress === 100
          const current = !done && doc.progress >= threshold
          const Icon = done ? CheckCircle2 : current ? Loader2 : Circle
          return (
            <li key={label} className={done ? 'done' : current ? 'current' : ''}>
              <Icon aria-hidden style={current ? { animation: 'spin 1s linear infinite' } : undefined} />{label}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function DocumentLayout() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { refreshUser } = useAuth()
  const { data: doc, error, loading, reload, setData } = useApi(() => documentsApi.get(id), [id])
  const subjects = useApi(() => subjectsApi.list(), [])
  const [renaming, setRenaming] = useState(false)
  const [title, setTitle] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [busy, setBusy] = useState(false)
  usePageTitle(doc?.title)

  const inProgress = doc && (doc.status === 'pending' || doc.status === 'processing')
  useInterval(async () => {
    const s = await documentsApi.status(id).catch(() => null)
    if (!s) return
    if (s.status === 'ready' || s.status === 'failed') { reload(); notifyDocumentsChanged() } else setData((d) => ({ ...d, ...s }))
  }, 3000, inProgress)

  useEffect(() => { if (doc?.status === 'ready') documentsApi.opened(id).catch(() => {}) }, [id, doc?.status])

  if (error) return <ErrorState error={error} onRetry={reload} />
  if (loading && !doc) return <PageLoader />
  if (!doc) return null

  const patch = async (payload, message) => {
    const updated = await documentsApi.update(id, payload)
    setData(updated)
    if (message) toast.success(message)
    notifyDocumentsChanged()
  }
  const reprocess = async () => {
    setBusy(true)
    try { await documentsApi.reprocess(id); await reload() } catch (err) { toast.error(err) } finally { setBusy(false) }
  }
  const remove = async () => {
    setBusy(true)
    try {
      await documentsApi.remove(id)
      toast.success('Document supprimé.')
      notifyDocumentsChanged(); refreshUser()
      navigate('/app/bibliotheque')
    } catch (err) { toast.error(err); setBusy(false) }
  }

  const base = `/app/documents/${id}`
  const tabs = [
    { to: base, label: 'Résumé', icon: BookOpenText, end: true },
    { to: `${base}/explication`, label: 'Explication', icon: Lightbulb },
    { to: `${base}/essentiel`, label: 'L’essentiel', icon: Sparkles },
    { to: `${base}/faq`, label: 'FAQ', icon: FileQuestion },
    { to: `${base}/assistant`, label: 'Assistant', icon: MessagesSquare },
    { to: `${base}/quiz`, label: 'Quiz', icon: ListChecks },
    { to: `${base}/fiches`, label: 'Fiches', icon: Layers },
    { to: `${base}/notes`, label: 'Notes', icon: NotebookPen },
    { to: `${base}/texte`, label: 'Texte', icon: FileText },
  ]

  return (
    <>
      <div className="doc-head">
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1>{doc.title}</h1>
          <div className="doc-meta">
            <StatusBadge status={doc.status} progress={doc.progress} />
            {doc.subject && <span className="row" style={{ gap: 6 }}><span className="dot" style={{ background: doc.subject.color }} />{doc.subject.name}</span>}
            {doc.page_count > 0 && <span>{doc.page_count} pages</span>}
            {doc.reading_minutes > 0 && <span>· {doc.reading_minutes} min de lecture</span>}
            {doc.language && <span>· {LANGUAGES[doc.language]}</span>}
            {doc.generated_by === 'extractive' && (
              <span className="badge badge--amber" title="Le modèle était hors ligne pendant l’analyse : le contenu est extrait du document. Relancez l’analyse quand l’IA est active.">Extraits</span>
            )}
          </div>
        </div>
        <div className="row">
          <Button variant="ghost" size="sm" iconOnly icon={Star} aria-label={doc.is_favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            style={doc.is_favorite ? { color: 'var(--amber)' } : undefined}
            onClick={async () => { const r = await documentsApi.toggleFavorite(id); setData((d) => ({ ...d, is_favorite: r.is_favorite })) }} />
          <Button variant="secondary" size="sm" icon={ExternalLink} onClick={() => window.open(doc.file_url, '_blank', 'noopener')}>PDF original</Button>
          <Menu items={[
            { label: 'Renommer', icon: Pencil, onClick: () => { setTitle(doc.title); setRenaming(true) } },
            { label: 'Relancer l’analyse', icon: RefreshCw, onClick: reprocess },
            { label: 'Supprimer', icon: Trash2, danger: true, onClick: () => setConfirmDelete(true) },
          ]} />
        </div>
      </div>

      {inProgress && <Processing doc={doc} />}

      {doc.status === 'failed' && (
        <Alert kind="error" title="L’analyse a échoué"
          action={<Button size="sm" icon={RefreshCw} onClick={reprocess} loading={busy}>Relancer</Button>}>
          {doc.error || 'Une erreur inconnue est survenue.'}
        </Alert>
      )}

      {doc.status === 'ready' && (
        <>
          <RouteTabs tabs={tabs} label="Outils du document" />
          <div className="doc-body"><Outlet context={{ doc, setDoc: setData, subjects: subjects.data || [], patch }} /></div>
        </>
      )}

      <Modal open={renaming} onClose={() => setRenaming(false)} title="Modifier le document"
        footer={<><Button variant="secondary" onClick={() => setRenaming(false)}>Annuler</Button>
          <Button onClick={async () => { await patch({ title }, 'Document mis à jour.'); setRenaming(false) }} disabled={!title.trim()}>Enregistrer</Button></>}>
        <div className="stack">
          <Input label="Titre" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Select label="Matière" placeholder="Aucune" value={doc.subject?.id || ''}
            options={(subjects.data || []).map((s) => ({ value: s.id, label: s.name }))}
            onChange={(e) => patch({ subject_id: e.target.value || null }, 'Matière modifiée.')} />
        </div>
      </Modal>
      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={remove} loading={busy}
        title="Supprimer ce document ?" message="Le document, ses conversations, quiz, fiches et notes liées seront supprimés définitivement." />
      {doc.status === 'failed' && <p className="tiny muted" style={{ marginTop: '1rem' }}><AlertCircle size={12} style={{ display: 'inline' }} /> Astuce : un PDF exporté depuis Word ou Google Docs s’analyse mieux qu’une photo de page.</p>}
    </>
  )
}
