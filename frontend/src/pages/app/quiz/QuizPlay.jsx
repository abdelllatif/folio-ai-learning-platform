import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Clock, Flag } from 'lucide-react'
import { quizzesApi } from '@/api'
import { Alert, Button, ConfirmDialog, EmptyState, ErrorState, PageLoader, ProgressBar } from '@/components/ui'
import { useToast } from '@/context/ToastContext'
import { useApi } from '@/hooks/useApi'
import { useInterval, usePageTitle } from '@/hooks/misc'
import { formatClock } from '@/context/TimerContext'

const KEYS = ['A', 'B', 'C', 'D', 'E', 'F']

export function QuizPlay() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const mistakesMode = params.get('mode') === 'erreurs'
  const navigate = useNavigate()
  const toast = useToast()
  const quiz = useApi(() => quizzesApi.get(id), [id])
  const mistakes = useApi(() => quizzesApi.mistakes(id), [id], { enabled: mistakesMode })
  usePageTitle(quiz.data ? 'Quiz en cours' : 'Quiz')

  const questions = useMemo(() => (mistakesMode ? mistakes.data : quiz.data?.questions) || [], [mistakesMode, mistakes.data, quiz.data])
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [confirm, setConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const startedAt = useRef(Date.now())
  const [elapsed, setElapsed] = useState(0)
  const limit = !mistakesMode && quiz.data?.time_limit_minutes ? quiz.data.time_limit_minutes * 60 : null

  useEffect(() => { startedAt.current = Date.now(); setIndex(0); setAnswers({}) }, [id, mistakesMode])
  useInterval(() => setElapsed(Math.round((Date.now() - startedAt.current) / 1000)), 1000, questions.length > 0 && !submitting)

  const submit = useCallback(async () => {
    setSubmitting(true)
    try {
      const payload = Object.fromEntries(questions.map((q) => [q.id, answers[q.id] ?? null]))
      const attempt = await quizzesApi.submit(id, {
        answers: payload, duration_seconds: Math.round((Date.now() - startedAt.current) / 1000),
        mode: mistakesMode ? 'mistakes' : 'full',
      })
      navigate(`/app/tentatives/${attempt.id}`, { replace: true })
    } catch (err) {
      toast.error(err)
      setSubmitting(false)
    }
  }, [questions, answers, id, mistakesMode, navigate, toast])

  useEffect(() => { if (limit && elapsed >= limit && !submitting) { toast.info('Temps écoulé : le quiz est rendu.'); submit() } }, [limit, elapsed, submitting, submit, toast])

  // keyboard: 1-4 / A-D to answer, arrows to move
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest('input, textarea') || confirm) return
      const q = questions[index]
      if (!q) return
      const k = e.key.toUpperCase()
      const pos = /^[1-6]$/.test(k) ? Number(k) - 1 : KEYS.indexOf(k)
      if (pos >= 0 && q.choices[pos]) setAnswers((a) => ({ ...a, [q.id]: q.choices[pos].id }))
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(questions.length - 1, i + 1))
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [questions, index, confirm])

  if (quiz.error) return <ErrorState error={quiz.error} onRetry={quiz.reload} />
  if (quiz.loading || (mistakesMode && mistakes.loading)) return <PageLoader />
  if (!questions.length) {
    return (
      <div className="panel quiz-shell">
        <EmptyState title={mistakesMode ? 'Aucune erreur à revoir' : 'Ce quiz est vide'}
          action={<Button to={`/app/quiz/${id}`}>{mistakesMode ? 'Refaire le quiz complet' : 'Retour'}</Button>}>
          {mistakesMode ? 'Vous avez tout juste à votre dernière tentative.' : 'Générez un nouveau quiz depuis le document.'}
        </EmptyState>
      </div>
    )
  }

  const q = questions[index]
  const answered = questions.filter((x) => answers[x.id] != null).length
  const last = index === questions.length - 1
  const remaining = limit ? Math.max(0, limit - elapsed) : null

  return (
    <div className="quiz-shell">
      <div className="row-between" style={{ marginBottom: '1rem' }}>
        <Link to={`/app/documents/${quiz.data.document}/quiz`} className="small row" style={{ gap: 4 }}><ArrowLeft size={15} />{quiz.data.document_title}</Link>
        <span className={`badge ${remaining != null && remaining < 60 ? 'badge--coral' : ''}`}>
          <Clock aria-hidden />{remaining != null ? `${formatClock(remaining)} restantes` : formatClock(elapsed)}
        </span>
      </div>
      {mistakesMode && <div style={{ marginBottom: '1rem' }}><Alert kind="warn">Mode « Revoir mes erreurs » : seulement les questions ratées la dernière fois.</Alert></div>}

      <div className="quiz-progress">
        <span className="small nowrap" style={{ fontWeight: 600 }}>Question {index + 1} / {questions.length}</span>
        <ProgressBar value={(answered / questions.length) * 100} label="Questions répondues" className="grow" />
      </div>

      <div className="panel" style={{ padding: '1.75rem' }}>
        <p className="question">{q.prompt}</p>
        <div className="choices" role="radiogroup" aria-label="Réponses">
          {q.choices.map((c, i) => (
            <button key={c.id} type="button" role="radio" aria-checked={answers[q.id] === c.id}
              className={`choice ${answers[q.id] === c.id ? 'selected' : ''}`}
              onClick={() => setAnswers((a) => ({ ...a, [q.id]: c.id }))}>
              <span className="choice__key">{KEYS[i]}</span><span>{c.text}</span>
            </button>
          ))}
        </div>
        <p className="tiny muted" style={{ margin: '1rem 0 0' }}>Raccourcis : touches A–D ou 1–4 pour répondre, flèches pour naviguer.</p>
      </div>

      <div className="row-between" style={{ marginTop: '1.25rem' }}>
        <Button variant="secondary" icon={ArrowLeft} onClick={() => setIndex((i) => i - 1)} disabled={index === 0}>Précédente</Button>
        {last ? (
          <Button icon={Flag} onClick={() => (answered < questions.length ? setConfirm(true) : submit())} loading={submitting}>Rendre le quiz</Button>
        ) : (
          <Button iconRight={ArrowRight} onClick={() => setIndex((i) => i + 1)}>Suivante</Button>
        )}
      </div>

      <nav className="question-nav" aria-label="Aller à la question" style={{ marginTop: '1.5rem' }}>
        {questions.map((x, i) => (
          <button key={x.id} type="button" className={`${answers[x.id] != null ? 'answered' : ''} ${i === index ? 'current' : ''}`}
            onClick={() => setIndex(i)} aria-label={`Question ${i + 1}${answers[x.id] != null ? ', répondue' : ''}`}>{i + 1}</button>
        ))}
      </nav>

      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={() => { setConfirm(false); submit() }}
        danger={false} confirmLabel="Rendre quand même" title="Rendre le quiz ?"
        message={`${questions.length - answered} question${questions.length - answered > 1 ? 's sont restées' : ' est restée'} sans réponse : elles compteront comme fausses.`} />
    </div>
  )
}
