import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, FolderPlus, LayoutGrid, List, Pencil, Search, Star, Trash2, Upload } from 'lucide-react'
import { documentsApi, subjectsApi } from '@/api'
import { openUpload } from '@/components/layout/AppLayout'
import { DocumentCard, StatusBadge } from '@/components/documents/DocumentBits'
import { SubjectModal } from '@/components/documents/SubjectModal'
import { notifyDocumentsChanged } from '@/components/documents/UploadModal'
import { Button, ConfirmDialog, EmptyState, ErrorState, Menu, Select, SkeletonList } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { useApi } from '@/hooks/useApi'
import { useDebounce, useInterval, usePageTitle } from '@/hooks/misc'
import { formatDate } from '@/utils/format'

const SORTS = [
  { value: '-created_at', label: 'Plus récents' },
  { value: '-last_opened_at', label: 'Ouverts récemment' },
  { value: 'title', label: 'Titre (A→Z)' },
  { value: '-page_count', label: 'Plus longs' },
]
const STATUSES = [
  { value: 'ready', label: 'Prêts' },
  { value: 'processing', label: 'En cours' },
  { value: 'failed', label: 'En échec' },
]

export function Library() {
  usePageTitle('Bibliothèque')
  const toast = useToast()
  const { refreshUser } = useAuth()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState({ scope: 'all', status: '', ordering: '-created_at' })
  const [page, setPage] = useState(1)
  const [view, setView] = useState(() => { try { return localStorage.getItem('folio.libraryView') || 'grid' } catch { return 'grid' } })
  const [subjectModal, setSubjectModal] = useState({ open: false, subject: null })
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const search = useDebounce(query, 300)

  const subjects = useApi(() => subjectsApi.list(), [])
  const params = {
    search: search || undefined, ordering: filter.ordering, status: filter.status || undefined, page,
    is_favorite: filter.scope === 'favorites' ? true : undefined,
    unsorted: filter.scope === 'unsorted' ? true : undefined,
    subject: typeof filter.scope === 'number' ? filter.scope : undefined,
  }
  const docs = useApi(() => documentsApi.list(params), [search, filter, page])
  const [items, setItems] = useState([])

  useEffect(() => { setPage(1) }, [search, filter])
  useEffect(() => {
    if (!docs.data) return
    setItems((cur) => (page === 1 ? docs.data.results : [...cur, ...docs.data.results.filter((d) => !cur.some((c) => c.id === d.id))]))
  }, [docs.data, page])
  const reloadDocs = docs.reload
  const reloadSubjects = subjects.reload
  useEffect(() => {
    const reload = () => { setPage(1); reloadDocs(); reloadSubjects() }
    window.addEventListener('folio:documents-changed', reload)
    return () => window.removeEventListener('folio:documents-changed', reload)
  }, [reloadDocs, reloadSubjects])
  useEffect(() => { try { localStorage.setItem('folio.libraryView', view) } catch { /* ignore */ } }, [view])

  // refresh while documents are being analysed
  const processing = items.some((d) => d.status === 'pending' || d.status === 'processing')
  useInterval(() => { if (page === 1) docs.reload() }, 4000, processing)

  const toggleFavorite = async (doc) => {
    const res = await documentsApi.toggleFavorite(doc.id)
    setItems((cur) => cur.map((d) => (d.id === doc.id ? { ...d, is_favorite: res.is_favorite } : d)))
  }
  const moveTo = async (doc, subjectId) => {
    await documentsApi.update(doc.id, { subject_id: subjectId })
    toast.success('Document rangé.')
    docs.reload(); subjects.reload()
  }
  const remove = async () => {
    setDeleting(true)
    try {
      await documentsApi.remove(toDelete.id)
      setItems((cur) => cur.filter((d) => d.id !== toDelete.id))
      toast.success('Document supprimé.')
      subjects.reload(); refreshUser(); notifyDocumentsChanged()
    } catch (err) { toast.error(err) } finally { setDeleting(false); setToDelete(null) }
  }
  const deleteSubject = async (s) => {
    await subjectsApi.remove(s.id)
    toast.success(`Matière « ${s.name} » supprimée. Ses documents restent dans la bibliothèque.`)
    if (filter.scope === s.id) setFilter((f) => ({ ...f, scope: 'all' }))
    subjects.reload(); docs.reload()
  }

  const scopeChip = (value, label, color) => (
    <button key={String(value)} type="button" className="chip" aria-pressed={filter.scope === value}
      onClick={() => setFilter((f) => ({ ...f, scope: value }))}>
      {color && <span className="dot" style={{ background: color }} />}{label}
    </button>
  )
  const currentSubject = subjects.data?.find((s) => s.id === filter.scope)
  const filtersActive = search || filter.status || filter.scope !== 'all'

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Bibliothèque</h1>
          <p>{docs.data ? `${docs.data.count} document${docs.data.count > 1 ? 's' : ''}` : ' '}</p>
        </div>
        <div className="page-head__actions">
          <Button variant="secondary" icon={FolderPlus} onClick={() => setSubjectModal({ open: true, subject: null })}>Nouvelle matière</Button>
          <Button icon={Upload} onClick={openUpload}>Déposer un PDF</Button>
        </div>
      </div>

      <div className="subject-chips" role="group" aria-label="Filtrer par matière">
        {scopeChip('all', 'Tous')}
        {scopeChip('favorites', '★ Favoris')}
        {subjects.data?.map((s) => scopeChip(s.id, `${s.name} (${s.document_count})`, s.color))}
        {subjects.data?.length > 0 && scopeChip('unsorted', 'Sans matière')}
        {currentSubject && (
          <Menu label="Actions sur la matière" items={[
            { label: 'Renommer', icon: Pencil, onClick: () => setSubjectModal({ open: true, subject: currentSubject }) },
            { label: 'Supprimer la matière', icon: Trash2, danger: true, onClick: () => deleteSubject(currentSubject) },
          ]} />
        )}
      </div>

      <div className="toolbar">
        <div className="input-group">
          <Search aria-hidden />
          <input className="input" type="search" placeholder="Titre, résumé, matière…" aria-label="Rechercher un document"
            value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Select aria-label="Statut" placeholder="Tous les statuts" options={STATUSES} value={filter.status}
          onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))} />
        <Select aria-label="Trier" options={SORTS} value={filter.ordering}
          onChange={(e) => setFilter((f) => ({ ...f, ordering: e.target.value }))} />
        <div className="segmented" role="group" aria-label="Affichage">
          <button type="button" aria-pressed={view === 'grid'} onClick={() => setView('grid')} aria-label="Grille"><LayoutGrid size={16} /></button>
          <button type="button" aria-pressed={view === 'list'} onClick={() => setView('list')} aria-label="Liste"><List size={16} /></button>
        </div>
      </div>

      {docs.error && <ErrorState error={docs.error} onRetry={docs.reload} />}
      {docs.loading && !items.length && <SkeletonList rows={5} />}

      {!docs.loading && !docs.error && items.length === 0 && (
        <div className="panel">
          {filtersActive ? (
            <EmptyState icon={Search} title="Aucun document ne correspond"
              action={<Button variant="secondary" onClick={() => { setQuery(''); setFilter({ scope: 'all', status: '', ordering: '-created_at' }) }}>Effacer les filtres</Button>}>
              Essayez un autre mot ou une autre matière.
            </EmptyState>
          ) : (
            <EmptyState icon={BookOpen} title="Votre bibliothèque est vide"
              action={<Button icon={Upload} onClick={openUpload}>Déposer un PDF</Button>}>
              Déposez un cours, un TD ou des annales pour commencer.
            </EmptyState>
          )}
        </div>
      )}

      {items.length > 0 && view === 'grid' && (
        <div className="doc-grid">{items.map((d) => <DocumentCard key={d.id} doc={d} />)}</div>
      )}

      {items.length > 0 && view === 'list' && (
        <div className="panel panel--flush table-wrap">
          <table className="table">
            <thead><tr><th>Titre</th><th>Matière</th><th>Statut</th><th>Pages</th><th>Ajouté le</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {items.map((d) => (
                <tr key={d.id}>
                  <td style={{ maxWidth: 380 }}>
                    <Link to={`/app/documents/${d.id}`} style={{ fontWeight: 500, color: 'var(--ink)' }} className="truncate" title={d.title}>{d.is_favorite && '★ '}{d.title}</Link>
                  </td>
                  <td>{d.subject ? <span className="row"><span className="dot" style={{ background: d.subject.color }} />{d.subject.name}</span> : <span className="muted">—</span>}</td>
                  <td><StatusBadge status={d.status} progress={d.progress} /></td>
                  <td>{d.page_count || '—'}</td>
                  <td className="nowrap">{formatDate(d.created_at)}</td>
                  <td>
                    <Menu items={[
                      { label: d.is_favorite ? 'Retirer des favoris' : 'Ajouter aux favoris', icon: Star, onClick: () => toggleFavorite(d) },
                      ...(subjects.data || []).filter((s) => s.id !== d.subject?.id).map((s) => ({ label: `Ranger dans ${s.name}`, icon: FolderPlus, onClick: () => moveTo(d, s.id) })),
                      d.subject && { label: 'Retirer de la matière', icon: FolderPlus, onClick: () => moveTo(d, null) },
                      { label: 'Supprimer', icon: Trash2, danger: true, onClick: () => setToDelete(d) },
                    ]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {docs.data?.next && (
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Button variant="secondary" onClick={() => setPage((p) => p + 1)} loading={docs.loading}>Afficher plus</Button>
        </div>
      )}

      <SubjectModal open={subjectModal.open} subject={subjectModal.subject}
        onClose={() => setSubjectModal({ open: false, subject: null })} onSaved={() => { subjects.reload(); docs.reload() }} />
      <ConfirmDialog open={Boolean(toDelete)} onClose={() => setToDelete(null)} onConfirm={remove} loading={deleting}
        title="Supprimer ce document ?"
        message={`« ${toDelete?.title} » sera supprimé avec ses conversations, quiz et fiches. Cette action est définitive.`} />
    </>
  )
}
