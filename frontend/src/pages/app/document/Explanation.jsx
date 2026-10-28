import { useOutletContext } from 'react-router-dom'
import { SaveToNotes } from '@/components/notes/SaveToNotes'
import { Alert, Markdown } from '@/components/ui'

export function Explanation() {
  const { doc } = useOutletContext()
  return (
    <div style={{ maxWidth: 760 }}>
      <div className="row-between" style={{ marginBottom: '1rem' }}>
        <p className="muted small" style={{ margin: 0 }}>Le cours reformulé simplement, notion par notion.</p>
        <SaveToNotes documentId={doc.id} quote={doc.explanation} title="Explication" />
      </div>
      {doc.explanation ? <Markdown>{doc.explanation}</Markdown>
        : <Alert>L’explication n’est pas disponible pour ce document. Relancez l’analyse depuis le menu du document.</Alert>}
    </div>
  )
}
