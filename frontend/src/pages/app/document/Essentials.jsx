import { useOutletContext } from 'react-router-dom'
import { Copy } from 'lucide-react'
import { SaveToNotes } from '@/components/notes/SaveToNotes'
import { Button, EmptyState } from '@/components/ui'
import { useToast } from '@/context/ToastContext'

export function Essentials() {
  const { doc } = useOutletContext()
  const toast = useToast()
  const sheet = [
    `# ${doc.title}`, '', '## À retenir', ...doc.key_points.map((p) => `- ${p}`), '',
    '## Glossaire', ...doc.glossary.map((g) => `- **${g.term}** : ${g.definition}`),
  ].join('\n')

  return (
    <div className="grid-2" style={{ gap: '2.5rem', alignItems: 'start' }}>
      <section>
        <div className="row-between" style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontSize: 'var(--fs-md)', margin: 0 }}>Les points à retenir</h2>
          <div className="row">
            <Button variant="ghost" size="sm" icon={Copy}
              onClick={async () => { await navigator.clipboard.writeText(sheet); toast.success('Fiche copiée.') }}>Copier la fiche</Button>
            <SaveToNotes documentId={doc.id} quote={doc.key_points.map((p) => `• ${p}`).join('\n')} title="À retenir" label="Garder" />
          </div>
        </div>
        {doc.key_points.length ? (
          <ol className="key-points">{doc.key_points.map((p) => <li key={p}>{p}</li>)}</ol>
        ) : <p className="muted">Aucun point clé détecté.</p>}
      </section>

      <section>
        <h2 style={{ fontSize: 'var(--fs-md)', marginBottom: '0.5rem' }}>Glossaire</h2>
        {doc.glossary.length ? (
          <dl className="glossary">
            {doc.glossary.map((g) => <div key={g.term}><dt>{g.term}</dt><dd>{g.definition}</dd></div>)}
          </dl>
        ) : (
          <EmptyState title="Pas de définition repérée">Le document ne contient pas de définitions explicites.</EmptyState>
        )}
      </section>
    </div>
  )
}
