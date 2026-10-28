import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CheckCircle2, MessagesSquare, RotateCcw, RotateCw, XCircle } from 'lucide-react'
import { quizzesApi } from '@/api'
import { Button, ErrorState, PageLoader, ProgressRing, Segmented } from '@/components/ui'
import { useApi } from '@/hooks/useApi'
import { usePageTitle } from '@/hooks/misc'
import { formatDuration, scoreTone } from '@/utils/format'

const MESSAGES = [
  [100, 'Sans faute. Ce cours est maîtrisé.'],
  [80, 'Très bon résultat. Revoyez les quelques erreurs et c’est acquis.'],
  [50, 'Les bases sont là. Revoir vos erreurs consolidera le reste.'],
  [0, 'C’est un début. Relisez le résumé, puis retentez vos erreurs.'],
]

export function AttemptReview() {
  const { id } = useParams()
  const { data: attempt, error, loading, reload } = useApi(() => quizzesApi.attempt(id), [id])
  const [filter, setFilter] = useState('all')
  usePageTitle('Correction')

  if (error) return <ErrorState error={error} onRetry={reload} />
  if (loading || !attempt) return <PageLoader />

  const wrong = attempt.answers.filter((a) => !a.is_correct).length
  const shown = attempt.answers.filter((a) => filter === 'all' || !a.is_correct)
  const message = MESSAGES.find(([min]) => attempt.percent >= min)[1]

  return (
    <div className="quiz-shell">
      <div className="panel score-hero">
        <ProgressRing value={attempt.percent} size={96} stroke={8} tone={scoreTone(attempt.percent)} label={`Score ${attempt.percent} %`}>
          {attempt.score}/{attempt.total}
        </ProgressRing>
        <h1>{Math.round(attempt.percent)} %</h1>
        <p className="muted">{message}</p>
        <p className="tiny muted">
          {attempt.mode === 'mistakes' ? 'Révision des erreurs' : 'Quiz complet'} · {formatDuration(attempt.duration_seconds)} · <Link to={`/app/documents/${attempt.document}`}>{attempt.document_title}</Link>
        </p>
        <div className="row wrap" style={{ justifyContent: 'center', marginTop: '1rem' }}>
          {wrong > 0 && <Button icon={RotateCcw} to={`/app/quiz/${attempt.quiz}?mode=erreurs`}>Revoir mes {wrong} erreur{wrong > 1 ? 's' : ''}</Button>}
          <Button variant="secondary" icon={RotateCw} to={`/app/quiz/${attempt.quiz}`}>Refaire le quiz</Button>
          <Button variant="ghost" icon={MessagesSquare} to={`/app/documents/${attempt.document}/assistant`}>Poser une question</Button>
        </div>
      </div>

      <div className="row-between" style={{ margin: '2rem 0 0.5rem' }}>
        <h2 style={{ fontSize: 'var(--fs-md)', margin: 0 }}>Correction</h2>
        <Segmented value={filter} onChange={setFilter} label="Filtrer"
          options={[{ value: 'all', label: `Toutes (${attempt.total})` }, { value: 'wrong', label: `Erreurs (${wrong})` }]} />
      </div>
      {shown.map((a, i) => (
        <article key={a.question_id} className="review-item">
          <div className="review-item__q">
            {a.is_correct ? <CheckCircle2 color="var(--mint)" aria-label="Juste" /> : <XCircle color="var(--coral)" aria-label="Faux" />}
            <span>{filter === 'all' ? `${i + 1}. ` : ''}{a.prompt}</span>
          </div>
          <div className="choices">
            {a.choices.map((c) => {
              const isCorrect = c.id === a.correct_choice
              const isChosen = c.id === a.chosen_choice
              return (
                <div key={c.id} className={`choice ${isCorrect ? 'correct' : isChosen ? 'wrong' : ''}`} style={{ cursor: 'default' }}>
                  <span className="choice__key">{isCorrect ? '✓' : isChosen ? '✗' : ''}</span>
                  <span className="grow">{c.text}</span>
                  {isChosen && <span className="tiny muted">votre réponse</span>}
                </div>
              )
            })}
          </div>
          {a.chosen_choice == null && <p className="tiny" style={{ color: 'var(--coral)', margin: '0.5rem 0 0' }}>Sans réponse</p>}
          {(a.explanation || a.page) && (
            <p className="small" style={{ margin: '0.75rem 0 0', color: 'var(--ink-2)' }}>
              {a.explanation} {a.page && <Link to={`/app/documents/${attempt.document}/texte?page=${a.page}`} className="nowrap">Voir la page {a.page}</Link>}
            </p>
          )}
        </article>
      ))}
    </div>
  )
}
