import {
  BookOpenText, CalendarClock, CheckCircle2, FileQuestion, Layers, Lightbulb, ListChecks,
  MessagesSquare, NotebookPen, Quote, RotateCcw, Sparkles, Target, Timer,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui'
import { usePageTitle } from '@/hooks/misc'

const FEATURE_GROUPS = [
  {
    title: 'Comprendre',
    items: [
      { icon: Sparkles, name: 'Titre, résumé et métadonnées', text: 'Matière, niveau, langue et temps de lecture détectés dès le dépôt.' },
      { icon: Lightbulb, name: 'Explication pas à pas', text: 'Les notions clés reformulées simplement, avec les pièges fréquents.' },
      { icon: BookOpenText, name: 'L’essentiel et le glossaire', text: 'Les points à retenir et chaque définition du cours, au même endroit.' },
      { icon: FileQuestion, name: 'FAQ du document', text: 'Les questions qu’on se pose en lisant, avec leur réponse.' },
    ],
  },
  {
    title: 'S’entraîner',
    items: [
      { icon: MessagesSquare, name: 'Assistant avec sources', text: 'Posez vos questions : chaque réponse cite la page du cours.' },
      { icon: ListChecks, name: 'Quiz générés', text: 'QCM et vrai/faux, trois niveaux, sur tout le cours ou un chapitre.' },
      { icon: RotateCcw, name: 'Revoir mes erreurs', text: 'Refaites uniquement les questions ratées, avec l’explication.' },
      { icon: Layers, name: 'Fiches à répétition espacée', text: 'Chaque fiche revient juste avant que vous ne l’oubliiez.' },
    ],
  },
  {
    title: 'S’organiser',
    items: [
      { icon: CalendarClock, name: 'Planning d’examen', text: 'Une date, des documents : Folio prépare le programme jour par jour.' },
      { icon: Timer, name: 'Minuteur Pomodoro', text: 'Des sessions de 25 minutes, comptées dans votre objectif du jour.' },
      { icon: Target, name: 'Progression et séries', text: 'Scores, maîtrise par cours, jours d’affilée et badges.' },
      { icon: NotebookPen, name: 'Notes liées aux pages', text: 'Gardez un passage, ajoutez vos mots, exportez votre fiche.' },
    ],
  },
]

function DeskPreview() {
  return (
    <div className="desk" aria-hidden>
      <div className="desk__page">
        <h4>Chapitre 2 — Le modèle relationnel</h4>
        <p style={{ margin: 0 }}>
          Les données sont organisées en tables reliées entre elles.{' '}
          <mark className="hl">Une clé primaire est un attribut qui identifie de façon unique chaque ligne d’une table.</mark>{' '}
          Une clé étrangère référence la clé primaire d’une autre table, ce qui permet de relier les informations
          sans les dupliquer. La normalisation réduit ensuite la redondance…
        </p>
        <span className="pageno">p. 14</span>
      </div>
      <div className="desk__note desk__note--1">
        <b><MessagesSquare aria-hidden />Assistant</b>
        Une clé primaire identifie chaque ligne de façon unique <span className="cite">1</span>
        <div className="tiny muted" style={{ marginTop: 4 }}>[1] p. 14</div>
      </div>
      <div className="desk__note desk__note--2">
        <b><ListChecks aria-hidden />Quiz · question 3/10</b>
        Que référence une clé étrangère ?
        <div className="desk__choice">○ Une ligne vide</div>
        <div className="desk__choice ok"><CheckCircle2 size={14} aria-hidden />La clé primaire d’une autre table</div>
      </div>
    </div>
  )
}

export function Home() {
  usePageTitle()
  return (
    <>
      <section className="hero">
        <div className="container hero__grid">
          <div>
            <h1><mark className="hl hl--draw">Votre cours, lu, résumé et prêt à réviser.</mark></h1>
            <p className="hero__lead">
              Déposez un PDF de cours, de TD ou d’annales. Folio en tire un résumé, une explication, des quiz
              et des fiches, et répond à vos questions en citant la page exacte.
            </p>
            <div className="hero__actions">
              <Button to="/inscription" size="lg">Créer mon compte gratuit</Button>
              <Button to="/fonctionnalites" size="lg" variant="secondary">Voir ce que fait Folio</Button>
            </div>
            <p className="hero__note">Gratuit jusqu’à 15 documents. Sans carte bancaire.</p>
          </div>
          <DeskPreview />
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section__head">
            <h2>Trois étapes entre votre PDF et vos révisions</h2>
          </div>
          <div className="steps">
            <div className="step">
              <span className="step__n">Étape 1</span>
              <h3>Déposez votre PDF</h3>
              <p>Cours, polycopié, TD, article ou annale. Les PDF scannés sont lus par reconnaissance de texte.</p>
            </div>
            <div className="step">
              <span className="step__n">Étape 2</span>
              <h3>Folio l’analyse</h3>
              <p>Titre, résumé, notions clés, glossaire et FAQ sont prêts en quelques minutes, page par page.</p>
            </div>
            <div className="step">
              <span className="step__n">Étape 3</span>
              <h3>Vous révisez</h3>
              <p>Questions à l’assistant, quiz, fiches et planning jusqu’au jour de l’examen.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--surface)', borderBlock: '1px solid var(--line)' }}>
        <div className="container">
          <div className="section__head">
            <h2>Tout ce qu’il faut pour passer de « j’ai lu » à « je sais »</h2>
            <p>Chaque outil part de votre document. Rien n’est inventé à côté.</p>
          </div>
          <div className="feature-cols">
            {FEATURE_GROUPS.map((group) => (
              <div key={group.title}>
                <h3>{group.title}</h3>
                <ul className="feature-list">
                  {group.items.map(({ icon: Icon, name, text }) => (
                    <li key={name}>
                      <span className="ico"><Icon aria-hidden /></span>
                      <div><strong>{name}</strong><span>{text}</span></div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container proof">
          <div>
            <h2>Des réponses que vous pouvez vérifier</h2>
            <p className="muted" style={{ fontSize: 'var(--fs-md)' }}>
              L’assistant ne répond qu’à partir de votre document. Chaque phrase renvoie à l’extrait et à la page
              d’où elle vient. Si le cours ne contient pas la réponse, il vous le dit au lieu d’inventer.
            </p>
            <ul className="feature-list" style={{ marginTop: '1.5rem' }}>
              <li><span className="ico"><Quote aria-hidden /></span><div><strong>Citations cliquables</strong><span>Un clic sur [2] affiche le passage exact.</span></div></li>
              <li><span className="ico"><BookOpenText aria-hidden /></span><div><strong>Une conversation par document</strong><span>Retrouvez vos échanges dans chaque cours.</span></div></li>
            </ul>
          </div>
          <div className="chat-demo" aria-hidden>
            <div className="msg msg--user">Quelle est la différence entre clé primaire et clé étrangère ?</div>
            <div className="msg msg--assistant">
              <div className="reading" style={{ fontSize: '1rem' }}>
                La clé primaire identifie chaque ligne d’une table <span className="cite">1</span>. La clé étrangère, elle,
                pointe vers la clé primaire d’une autre table pour relier les deux <span className="cite">2</span>.
              </div>
              <div className="msg__meta"><span className="badge badge--yellow">[1] p. 14</span><span className="badge badge--yellow">[2] p. 15</span></div>
            </div>
            <div className="msg msg--user">Qui a inventé le langage Python ?</div>
            <div className="msg msg--assistant msg--refused small">Je ne trouve pas cette information dans le document.</div>
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <div className="section__head"><h2>Pensé pour chaque façon d’étudier</h2></div>
          <div className="audience">
            <div><h3>Lycée et bac</h3><p>Fiches de cours, quiz par chapitre et un planning jusqu’à l’épreuve.</p></div>
            <div><h3>Université</h3><p>Polycopiés de 100 pages résumés et interrogeables en quelques minutes.</p></div>
            <div><h3>Prépa et concours</h3><p>Répétition espacée et suivi des points faibles sur tout le programme.</p></div>
            <div><h3>Établissements</h3><p>Des comptes pour vos classes et un suivi de l’usage. <Link to="/tarifs#etablissements">Voir l’offre</Link></p></div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cta-band">
            <div>
              <h2>Déposez votre premier cours maintenant</h2>
              <p>Créer un compte prend une minute. Les 15 premiers documents sont gratuits.</p>
            </div>
            <Button to="/inscription" size="lg">Commencer gratuitement</Button>
          </div>
        </div>
      </section>
    </>
  )
}
