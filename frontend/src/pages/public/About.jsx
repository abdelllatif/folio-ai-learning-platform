import { Lock, Quote, ShieldCheck, Sprout } from 'lucide-react'
import { Button } from '@/components/ui'
import { usePageTitle } from '@/hooks/misc'

const PRINCIPLES = [
  { icon: Quote, title: 'Toujours sourcé', text: 'Une réponse sans source n’aide pas à réviser. Chaque réponse de Folio renvoie à la page du cours, et Folio dit quand il ne sait pas.' },
  { icon: Lock, title: 'Vos cours restent à vous', text: 'Les documents ne servent qu’à votre compte. Les modèles tournent sur nos propres serveurs et ne sont jamais réentraînés avec vos fichiers.' },
  { icon: Sprout, title: 'Apprendre, pas copier', text: 'Folio fabrique des quiz, des fiches et des explications pour que vous compreniez, pas des devoirs tout faits.' },
  { icon: ShieldCheck, title: 'Accessible', text: 'Une offre gratuite complète, un prix étudiant pour le reste, et une interface lisible le soir comme le jour.' },
]

export function About() {
  usePageTitle('À propos')
  return (
    <div className="container">
      <header className="page-hero">
        <h1>Nous construisons l’outil de révision que nous aurions voulu avoir</h1>
        <p>
          Folio est né d’un constat simple : les étudiants reçoivent des centaines de pages de PDF par semestre,
          mais presque aucun outil pour les transformer en connaissances. Relire ne suffit pas ; il faut résumer,
          se poser des questions, s’interroger à intervalles réguliers. Folio fait ce travail de préparation
          pour que le temps d’étude serve à apprendre.
        </p>
      </header>

      <section className="section--tight">
        <h2 style={{ fontSize: 'var(--fs-xl)' }}>Nos principes</h2>
        <ul className="feature-list grid-2" style={{ gap: '1.75rem 3rem', marginTop: '1.5rem' }}>
          {PRINCIPLES.map(({ icon: Icon, title, text }) => (
            <li key={title}><span className="ico"><Icon aria-hidden /></span><div><strong style={{ fontSize: 'var(--fs-base)' }}>{title}</strong><span>{text}</span></div></li>
          ))}
        </ul>
      </section>

      <section className="section">
        <div className="grid-2" style={{ gap: '3rem' }}>
          <div>
            <h2 style={{ fontSize: 'var(--fs-xl)' }}>Comment ça marche, techniquement</h2>
            <p className="muted">
              Le texte de chaque page est extrait (PyMuPDF, pdfplumber, Tesseract pour les scans), découpé en passages,
              puis indexé avec des représentations sémantiques multilingues (Sentence-Transformers). Quand vous posez une
              question, les passages les plus proches sont retrouvés, puis un modèle de langage exécuté localement
              (Qwen2.5 via Ollama) rédige la réponse à partir de ces passages uniquement : c’est la génération augmentée
              par la recherche, ou RAG.
            </p>
          </div>
          <div>
            <h2 style={{ fontSize: 'var(--fs-xl)' }}>Pour les établissements</h2>
            <p className="muted">
              Nous travaillons avec des lycées, des écoles et des centres de soutien qui veulent donner à leurs élèves un
              outil de révision fiable. Parlons de vos classes.
            </p>
            <Button to="/contact?sujet=school" variant="secondary">Contacter l’équipe</Button>
          </div>
        </div>
      </section>
    </div>
  )
}
