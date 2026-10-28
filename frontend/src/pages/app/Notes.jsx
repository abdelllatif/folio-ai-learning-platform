import { useState } from 'react'
import { Download, NotebookPen, Plus, Search } from 'lucide-react'
import { documentsApi, downloadExport, notesApi } from '@/api'
import { NoteEditor } from '@/components/notes/NoteEditor'
import { NoteGrid } from '@/components/notes/NoteGrid'
import { Button, EmptyState, ErrorState, Select, SkeletonList } from '@/components/ui'
import { useApi } from '@/hooks/useApi'
import { useDebounce, usePageTitle } from '@/hooks/misc'
import { useNotes } from '@/hooks/useNotes'
import { NOTE_COLORS } from '@/utils/constants'

export function Notes() {
  usePageTitle('Notes')
  const [query, setQuery] = useState('')
  const [docFilter, setDocFilter] = useState('')
  const [color, setColor] = useState('')
  const [tag, setTag] = useState('')
  const search = useDebounce(query)
  const docs = useApi(() => documentsApi.list({ page_size: 100 }), [])
  const { notes, editing, setEditing, remove, togglePin } = useNotes(
    { search: search || undefined, document: docFilter || undefined, color: color || undefined, tag: tag || undefined },
    [search, docFilter, color, tag],
  )
  const tags = [...new Set((notes.data?.results || []).flatMap((n) => n.tags))].sort()
  const filtered = search || docFilter || color || tag

  return (
    <>
      <div className="page-head">
        <div><h1>Notes</h1><p>Vos passages gardés et vos propres mots, liés aux pages des cours.</p></div>
        <div className="page-head__actions">
          <Button variant="secondary" icon={Download}
            onClick={() => downloadExport(`${notesApi.exportUrl}${docFilter ? `?document=${docFilter}` : ''}`, 'notes-folio.md')}>Exporter</Button>
          <Button icon={Plus} onClick={() => setEditing({})}>Nouvelle note</Button>
        </div>
      </div>
      <div className="toolbar">
        <div className="input-group"><Search aria-hidden />
          <input className="input" type="search" placeholder="Chercher dans les notes…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Chercher dans les notes" /></div>
        <Select aria-label="Document" placeholder="Tous les documents" value={docFilter} onChange={(e) => setDocFilter(e.target.value)}
          options={(docs.data?.results || []).map((d) => ({ value: d.id, label: d.title }))} />
        <Select aria-label="Couleur" placeholder="Toutes les couleurs" value={color} onChange={(e) => setColor(e.target.value)} options={NOTE_COLORS} />
        {tags.length > 0 && <Select aria-label="Étiquette" placeholder="Toutes les étiquettes" value={tag} onChange={(e) => setTag(e.target.value)} options={tags.map((t) => ({ value: t, label: `#${t}` }))} />}
      </div>
      {notes.error && <ErrorState error={notes.error} onRetry={notes.reload} />}
      {notes.loading && !notes.data && <SkeletonList />}
      {notes.data?.results?.length === 0 && (
        <div className="panel">
          <EmptyState icon={NotebookPen} title={filtered ? 'Aucune note ne correspond' : 'Pas encore de notes'}
            action={!filtered && <Button icon={Plus} onClick={() => setEditing({})}>Écrire une note</Button>}>
            {filtered ? 'Essayez d’autres filtres.' : 'Utilisez « Garder dans mes notes » sur un résumé ou une réponse, ou écrivez la vôtre.'}
          </EmptyState>
        </div>
      )}
      {notes.data?.results?.length > 0 && <NoteGrid notes={notes.data.results} onEdit={setEditing} onDelete={remove} onTogglePin={togglePin} />}
      <NoteEditor open={Boolean(editing)} note={editing?.id ? editing : null} onClose={() => setEditing(null)}
        documents={docs.data?.results || []} onSaved={notes.reload} />
    </>
  )
}
