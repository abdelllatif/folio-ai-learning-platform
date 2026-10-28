import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, Coffee, Layers, ListChecks, ListTodo, RotateCcw, Trash2 } from 'lucide-react'
import { plannerApi } from '@/api'
import { Alert, Button, ConfirmDialog, ErrorState, PageLoader } from '@/components/ui'
import { useToast } from '@/context/ToastContext'
import { useApi } from '@/hooks/useApi'
import { usePageTitle } from '@/hooks/misc'
import { formatDay, formatMinutes, isoDate } from '@/utils/format'

const KIND = {
  read: { icon: BookOpen, color: 'var(--blue)', to: (id) => `/app/documents/${id}` },
  flashcards: { icon: Layers, color: 'var(--amber)', to: (id) => (id ? `/app/documents/${id}/fiches` : '/app/fiches/revision') },
  quiz: { icon: ListChecks, color: 'var(--mint)', to: (id) => (id ? `/app/documents/${id}/quiz` : '/app/quiz') },
  review: { icon: RotateCcw, color: 'var(--coral)', to: () => '/app/bibliotheque' },
  rest: { icon: Coffee, color: 'var(--ink-3)', to: null },
}

export function ExamPlan() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { data, error, loading, reload } = useApi(() => plannerApi.plan(id), [id])
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState(false)
  usePageTitle(data?.exam?.title)

  if (error) return <ErrorState error={error} onRetry={reload} />
  if (loading || !data) return <PageLoader />
  const { exam, days } = data
  const today = isoDate()

  const toTasks = async () => {
    setBusy(true)
    try { const r = await plannerApi.planToTasks(id); toast.success(`${r.created} tâches ajoutées à votre planning.`) } catch (err) { toast.error(err) } finally { setBusy(false) }
  }
  const remove = async () => { await plannerApi.removeExam(id); toast.success('Examen supprimé.'); navigate('/app/planning') }

  return (
    <>
      <Link to="/app/planning" className="small row" style={{ gap: 4, marginBottom: '0.75rem' }}><ArrowLeft size={15} />Planning</Link>
      <div className="page-head">
        <div>
          <h1>{exam.title}</h1>
          <p style={{ textTransform: 'capitalize' }}>{formatDay(exam.date)}{exam.location && ` · ${exam.location}`} · {exam.days_left >= 0 ? `J-${exam.days_left}` : 'passé'}</p>
        </div>
        <div className="page-head__actions">
          <Button variant="ghost" icon={Trash2} onClick={() => setConfirm(true)}>Supprimer</Button>
          <Button icon={ListTodo} onClick={toTasks} loading={busy} disabled={!days.length}>Ajouter au planning</Button>
        </div>
      </div>
      {exam.documents.length === 0 && <div style={{ marginBottom: '1rem' }}><Alert kind="warn">Aucun document n’est rattaché à cet examen : le plan reste général.</Alert></div>}
      {days.length === 0 ? <Alert>L’examen est aujourd’hui ou passé. Bon courage !</Alert> : (
        <div className="panel">
          <p className="small muted" style={{ marginTop: 0 }}>{formatMinutes(exam.daily_minutes)} par jour : lecture et fiches d’abord, puis quiz, puis révision générale. Repos la veille.</p>
          {days.map((day) => (
            <div key={day.date} className="plan-day" style={day.date === today ? { background: 'var(--highlight-soft)', margin: '0 -1.25rem', padding: '0.9rem 1.25rem' } : undefined}>
              <div className="plan-day__date">{day.date === today ? 'Aujourd’hui' : formatDay(day.date)}</div>
              <ul>
                {day.items.map((item, i) => {
                  const k = KIND[item.kind] || KIND.review
                  const Icon = k.icon
                  const label = <><Icon size={16} color={k.color} aria-hidden /><span className="grow">{item.label}</span>{item.minutes > 0 && <span className="tiny muted">{item.minutes} min</span>}</>
                  return <li key={i}>{k.to ? <Link to={k.to(item.document_id)} className="row grow" style={{ color: 'var(--ink)', textDecoration: 'none' }}>{label}</Link> : label}</li>
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={remove} title="Supprimer cet examen ?" message="Les tâches créées depuis ce plan seront aussi supprimées." />
    </>
  )
}
