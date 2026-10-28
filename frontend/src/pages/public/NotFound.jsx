import { FileQuestion } from 'lucide-react'
import { Button, EmptyState } from '@/components/ui'
import { usePageTitle } from '@/hooks/misc'

export function NotFound({ inApp }) {
  usePageTitle('Page introuvable')
  return (
    <div className="container" style={{ padding: '4rem 0' }}>
      <EmptyState icon={FileQuestion} title="Cette page n’existe pas"
        action={<Button to={inApp ? '/app' : '/'}>{inApp ? 'Retour au tableau de bord' : 'Retour à l’accueil'}</Button>}>
        Le lien est peut-être ancien, ou la page a été déplacée.
      </EmptyState>
    </div>
  )
}
