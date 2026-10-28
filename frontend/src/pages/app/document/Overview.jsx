import { useOutletContext } from 'react-router-dom'
import { Layers, ListChecks, MessagesSquare } from 'lucide-react'
import { SaveToNotes } from '@/components/notes/SaveToNotes'
import { Button, Markdown } from '@/components/ui'
import { LANGUAGES } from '@/utils/constants'
import { formatBytes, formatDate } from '@/utils/format'

export function Overview() {
  const { doc } = useOutletContext()
  const base = `/app/documents/${doc.id}`
  const facts = [
    ['Matière', doc.ai_subject || '—'],
    ['Niveau estimé', doc.ai_level || '—'],
    ['Type', doc.category || '—'],
    ['Langue', LANGUAGES[doc.language] || '—'],
    ['Pages', doc.page_count],
    ['Mots', doc.word_count?.toLocaleString('fr-FR')],
    ['Lecture', `${doc.reading_minutes} min`],
    ['Pages scannées (OCR)', doc.ocr_pages],
    ['Fichier', `${doc.original_filename} · ${formatBytes(doc.file_size)}`],
    ['Ajouté le', formatDate(doc.created_at)],
    ['Auteur (PDF)', doc.pdf_metadata?.author || doc.pdf_metadata?.Author || '—'],
  ]

  return (
    <div className="grid-main">
      <div>
        {doc.short_summary && (
          <p className="reading" style={{ fontSize: '1.15rem', marginBottom: '1.5rem' }}>
            <mark className="hl">{doc.short_summary}</mark>
          </p>
        )}
        <div className="row-between" style={{ marginBottom: '0.5rem' }}>
          <h2 style={{ fontSize: 'var(--fs-md)', margin: 0 }}>Résumé</h2>
          <SaveToNotes documentId={doc.id} quote={doc.summary} title="Résumé" />
        </div>
        <Markdown>{doc.summary}</Markdown>
        {doc.keywords?.length > 0 && (
          <>
            <h2 style={{ fontSize: 'var(--fs-md)', marginTop: '2rem' }}>Mots-clés</h2>
            <div className="keyword-cloud">{doc.keywords.map((k) => <span key={k} className="badge badge--blue">{k}</span>)}</div>
          </>
        )}
      </div>
      <aside className="stack" style={{ '--stack': '1.25rem' }}>
        <div className="panel">
          <h3 style={{ fontSize: 'var(--fs-base)' }}>Continuer avec ce cours</h3>
          <div className="stack" style={{ '--stack': '0.5rem' }}>
            <Button to={`${base}/assistant`} variant="secondary" icon={MessagesSquare} block>Poser une question</Button>
            <Button to={`${base}/quiz`} variant="secondary" icon={ListChecks} block>Faire un quiz</Button>
            <Button to={`${base}/fiches`} variant="secondary" icon={Layers} block>Réviser avec des fiches</Button>
          </div>
        </div>
        <div className="panel">
          <h3 style={{ fontSize: 'var(--fs-base)' }}>Informations</h3>
          <dl style={{ margin: 0, display: 'grid', gap: '0.55rem', fontSize: 'var(--fs-sm)' }}>
            {facts.map(([k, v]) => (
              <div key={k} className="row-between" style={{ alignItems: 'flex-start' }}>
                <dt className="muted">{k}</dt><dd style={{ margin: 0, textAlign: 'right', wordBreak: 'break-word' }}>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </aside>
    </div>
  )
}
