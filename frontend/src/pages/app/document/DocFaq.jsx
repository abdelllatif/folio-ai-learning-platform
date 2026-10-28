import { useOutletContext } from 'react-router-dom'
import { MessagesSquare, Plus } from 'lucide-react'
import { Button, EmptyState } from '@/components/ui'

export function DocFaq() {
  const { doc } = useOutletContext()
  return (
    <div style={{ maxWidth: 780 }}>
      <p className="muted small">Les questions qu’un étudiant se pose en lisant ce cours, avec leur réponse tirée du document.</p>
      {doc.faq.length === 0 && <EmptyState title="Pas encore de FAQ">Relancez l’analyse quand l’IA est active pour générer la FAQ.</EmptyState>}
      {doc.faq.map((item) => (
        <details key={item.question} className="faq-item">
          <summary>{item.question}<Plus aria-hidden /></summary>
          <div className="faq-item__body reading" style={{ fontSize: '1rem' }}>{item.answer}</div>
        </details>
      ))}
      <div className="panel" style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <span className="grow">Votre question n’est pas dans la liste ?</span>
        <Button to={`/app/documents/${doc.id}/assistant`} icon={MessagesSquare}>La poser à l’assistant</Button>
      </div>
    </div>
  )
}
