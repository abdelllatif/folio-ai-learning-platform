import {
  BarChart3, BookOpenText, CalendarClock, FileSearch, FileText, Layers, Lightbulb, ListChecks,
  MessagesSquare, NotebookPen, ScanText, Search, Timer,
} from 'lucide-react'
import { Button } from '@/components/ui'
import { usePageTitle } from '@/hooks/misc'

const SECTIONS = [
  {
    title: 'Analyse automatique du PDF',
    text: 'Dès le dépôt, Folio lit chaque page, y compris les tableaux, et passe les pages scannées à la reconnaissance de texte. Il en déduit un titre clair, la matière, le niveau, la langue, le nombre de pages et le temps de lecture.',
    points: [
      [ScanText, 'Lecture des PDF scannés (OCR)'],
      [FileText, 'Titre, matière, niveau et catégorie détectés'],
      [FileSearch, 'Recherche plein texte dans chaque document'],
    ],
  },
  {
    title: 'Comprendre le cours',
    text: 'Le résumé donne la vue d’ensemble ; l’explication reprend les notions une à une avec des exemples tirés du cours ; L’essentiel liste les points à retenir et le glossaire rassemble toutes les définitions.',
    points: [
      [BookOpenText, 'Résumé court et résumé détaillé'],
      [Lightbulb, 'Explication pédagogique et pièges fréquents'],
      [NotebookPen, 'Points clés, glossaire et FAQ du document'],
    ],
  },
  {
    title: 'Un assistant qui cite ses sources',
    text: 'Posez une question en langage courant. Folio cherche les passages pertinents dans le document, répond à partir d’eux seulement et numérote chaque source. Un clic sur le numéro affiche le passage et sa page.',
    points: [
      [MessagesSquare, 'Conversations rangées par document'],
      [Search, 'Refus explicite quand le cours ne contient pas la réponse'],
      [FileText, 'Export d’une conversation en Markdown'],
    ],
  },
  {
    title: 'S’entraîner et mémoriser',
    text: 'Générez un quiz sur tout le cours ou sur un thème, choisissez la difficulté et le chronomètre. Après chaque tentative, la correction explique chaque réponse et indique la page. Les fiches de révision suivent la répétition espacée (algorithme SM-2).',
    points: [
      [ListChecks, 'QCM et vrai/faux, trois niveaux de difficulté'],
      [BarChart3, 'Historique des tentatives et des scores'],
      [Layers, 'Fiches générées ou rédigées, révisées au bon moment'],
    ],
  },
  {
    title: 'S’organiser jusqu’à l’examen',
    text: 'Ajoutez la date d’un examen et les documents concernés : Folio répartit lecture, fiches, quiz et révision finale sur les jours restants, puis transforme ce plan en tâches à cocher. Le minuteur Pomodoro compte votre temps d’étude.',
    points: [
      [CalendarClock, 'Planning de révision jour par jour'],
      [Timer, 'Minuteur de concentration et objectif quotidien'],
      [BarChart3, 'Séries, carte d’activité, maîtrise par cours'],
    ],
  },
]

export function Features() {
  usePageTitle('Fonctionnalités')
  return (
    <div className="container">
      <header className="page-hero">
        <h1>Ce que Folio fait de vos cours</h1>
        <p>Un seul dépôt de PDF alimente le résumé, l’assistant, les quiz, les fiches et le planning. Voici le détail.</p>
      </header>
      {SECTIONS.map((s) => (
        <section key={s.title} className="section--tight" style={{ borderTop: '1px solid var(--line)' }}>
          <div className="grid-2" style={{ gap: '3rem', alignItems: 'start' }}>
            <div>
              <h2 style={{ fontSize: 'var(--fs-xl)' }}>{s.title}</h2>
              <p className="muted" style={{ fontSize: 'var(--fs-md)' }}>{s.text}</p>
            </div>
            <ul className="feature-list" style={{ paddingTop: '0.5rem' }}>
              {s.points.map(([Icon, label]) => (
                <li key={label}><span className="ico"><Icon aria-hidden /></span><div><strong>{label}</strong></div></li>
              ))}
            </ul>
          </div>
        </section>
      ))}
      <section className="section">
        <div className="cta-band">
          <div><h2>Essayez avec votre prochain cours</h2><p>Gratuit jusqu’à 15 documents.</p></div>
          <Button to="/inscription" size="lg">Créer mon compte</Button>
        </div>
      </section>
    </div>
  )
}
