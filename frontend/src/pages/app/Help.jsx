import { ContactForm } from '@/pages/public/Contact'
import { FaqList } from '@/components/public/FaqList'
import { usePageTitle } from '@/hooks/misc'

const GUIDE = [
  ['Déposez un cours', 'Bouton « Déposer un PDF » en haut de l’écran. L’analyse prend une à trois minutes.'],
  ['Lisez le résumé et L’essentiel', 'Vue d’ensemble, points clés et glossaire pour savoir de quoi parle le cours.'],
  ['Posez vos questions', 'Dans l’onglet Assistant. Cliquez sur les numéros pour vérifier la source.'],
  ['Testez-vous', 'Un quiz de 10 questions, puis « Revoir mes erreurs » jusqu’à 100 %.'],
  ['Mémorisez', 'Générez des fiches et révisez celles du jour, quelques minutes chaque jour.'],
  ['Planifiez', 'Ajoutez la date de l’examen : Folio répartit le travail jusqu’au jour J.'],
]

const SHORTCUTS = [
  ['Ctrl + K', 'Recherche globale'],
  ['Entrée / Maj + Entrée', 'Envoyer / nouvelle ligne dans l’assistant'],
  ['A–D ou 1–4', 'Répondre pendant un quiz'],
  ['← →', 'Question précédente / suivante'],
  ['Espace', 'Retourner une fiche'],
  ['1 à 4', 'Noter une fiche (À revoir → Facile)'],
]

export function Help() {
  usePageTitle('Aide')
  return (
    <>
      <div className="page-head"><div><h1>Aide</h1><p>Comment tirer le meilleur de Folio, et comment nous joindre.</p></div></div>
      <div className="grid-main">
        <div className="stack" style={{ '--stack': '1.25rem' }}>
          <section className="panel">
            <h2 style={{ fontSize: 'var(--fs-md)' }}>Bien démarrer</h2>
            <ol className="key-points" style={{ fontFamily: 'var(--font-ui)' }}>
              {GUIDE.map(([t, d]) => <li key={t} style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-sm)' }}><span><strong>{t}.</strong> <span className="muted">{d}</span></span></li>)}
            </ol>
          </section>
          <section className="panel"><h2 style={{ fontSize: 'var(--fs-md)' }}>Questions fréquentes</h2><FaqList /></section>
        </div>
        <aside className="stack" style={{ '--stack': '1.25rem' }}>
          <section className="panel">
            <h2 style={{ fontSize: 'var(--fs-md)' }}>Raccourcis clavier</h2>
            <dl style={{ margin: 0, display: 'grid', gap: '0.55rem' }}>
              {SHORTCUTS.map(([k, d]) => <div key={d} className="row-between small"><dt className="muted">{d}</dt><dd style={{ margin: 0 }}><span className="kbd">{k}</span></dd></div>)}
            </dl>
          </section>
          <section className="panel">
            <h2 style={{ fontSize: 'var(--fs-md)' }}>Écrire à l’équipe</h2>
            <ContactForm />
          </section>
        </aside>
      </div>
    </>
  )
}
