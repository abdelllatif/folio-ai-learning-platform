import { useOutletContext } from 'react-router-dom'
import { Download, NotebookPen, Plus } from 'lucide-react'
import { downloadExport, notesApi } from '@/api'
import { NoteEditor } from '@/components/notes/NoteEditor'
import { NoteGrid } from '@/components/notes/NoteGrid'
import { Button, EmptyState, SkeletonList } from '@/components/ui'
import { useNotes } from '@/hooks/useNotes'

export function DocNotes() {
  const { doc } = useOutletContext()
  const { notes, editing, setEditing, remove, togglePin } = useNotes({ document: doc.id, ordering: 'page' }, [doc.id])

  return (
    <div className="stack" style={{ '--stack': '1.25rem' }}>
      <div className="row-between">
        <p className="muted small" style={{ margin: 0 }}>Vos notes sur ce document, classées par page.</p>
        <div className="row">
          {notes.data?.results?.length > 0 && <Button variant="ghost" size="sm" icon={Download}
            onClick={() => downloadExport(`${notesApi.exportUrl}?document=${doc.id}`, `notes-${doc.id}.md`)}>Exporter</Button>}
          <Button icon={Plus} onClick={() => setEditing({})}>Nouvelle note</Button>
        </div>
      </div>
      {notes.loading && !notes.data && <SkeletonList rows={2} />}
      {notes.data?.results?.length === 0 && (
        <div className="panel"><EmptyState icon={NotebookPen} title="Aucune note sur ce cours" action={<Button icon={Plus} onClick={() => setEditing({})}>Écrire une note</Button>}>
          Gardez un passage du résumé, une réponse de l’assistant ou écrivez avec vos mots.
        </EmptyState></div>
      )}
      {notes.data?.results?.length > 0 && <NoteGrid notes={notes.data.results} showDocument={false} onEdit={setEditing} onDelete={remove} onTogglePin={togglePin} />}
      <NoteEditor open={Boolean(editing)} note={editing?.id ? editing : null} onClose={() => setEditing(null)}
        defaultDocument={doc.id} onSaved={notes.reload} />
    </div>
  )
}
