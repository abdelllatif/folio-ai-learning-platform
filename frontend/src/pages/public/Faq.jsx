import { Link } from 'react-router-dom'
import { FaqList } from '@/components/public/FaqList'
import { usePageTitle } from '@/hooks/misc'

export function Faq() {
  usePageTitle('Questions fréquentes')
  return (
    <div className="container">
      <header className="page-hero">
        <h1>Questions fréquentes</h1>
        <p>Vous ne trouvez pas votre réponse ? <Link to="/contact">Écrivez-nous</Link>, nous répondons sous 48 h ouvrées.</p>
      </header>
      <div style={{ maxWidth: 820 }}><FaqList /></div>
    </div>
  )
}
