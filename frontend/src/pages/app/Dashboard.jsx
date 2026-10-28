import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowUpRight, BookOpen, CalendarClock, Flame, Layers, ListChecks, Target, Upload,
} from 'lucide-react'
import { analyticsApi } from '@/api'
import { openUpload } from '@/components/layout/AppLayout'
import { DocIcon, StatusBadge } from '@/components/documents/DocumentBits'
import { WeekBars } from '@/components/charts/WeekBars'
import { ScoreTrend } from '@/components/charts/ScoreTrend'
import { Alert, Button, EmptyState, ErrorState, ProgressBar, ProgressRing, Skeleton } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { useApi } from '@/hooks/useApi'
import { usePageTitle } from '@/hooks/misc'
import { formatMinutes, greeting, plural, timeAgo } from '@/utils/format'

function Stat({ value, label, icon: Icon, to }) {
  const body = (
    <div className="stat">
      <div className="row" style={{ color: 'var(--ink-3)' }}><Icon size={16} aria-hidden /><span className="stat__label">{label}</span></div>
      <span className="stat__value">{value}</span>
    </div>
  )
  return to ? <Link to={to} style={{ color: 'inherit', textDecoration: 'none' }}>{body}</Link> : <div>{body}</div>
}

export function Dashboard() {
  usePageTitle('Tableau de bord')
  const { user } = useAuth()
  const [params] = useSearchParams()
  const { data, error, loading, reload } = useApi(() => analyticsApi.dashboard(), [])

  if (error) return <ErrorState error={error} onRetry={reload} />
  if (loading || !data) {
    return <div className="stack"><Skeleton height={60} /><Skeleton height={90} /><div className="grid-main"><Skeleton height={320} /><Skeleton height={320} /></div></div>
  }

  const isNew = data.documents.total === 0
  const goal = data.goal

  return (
    <>
      <div className="welcome">
        <div>
          <h1>{greeting()}, {user.first_name}</h1>
          <p className="muted" style={{ margin: 0 }}>
            {data.streak.current > 0
              ? `${plural(data.streak.current, 'jour')} d’affilée. ${data.streak.active_today ? 'Bien joué pour aujourd’hui.' : 'Une session aujourd’hui garde la série.'}`
              : 'Une courte session aujourd’hui lance votre série.'}
          </p>
        </div>
        <div className="row">
          <ProgressRing value={goal.percent} tone={goal.percent >= 100 ? 'mint' : 'blue'} label="Objectif du jour" size={56}>
            {goal.percent >= 100 ? '✓' : `${goal.percent}%`}
          </ProgressRing>
          <div className="small">
            <strong>Objectif du jour</strong>
            <div className="muted">{formatMinutes(goal.today_minutes)} sur {formatMinutes(goal.daily_minutes)}</div>
          </div>
        </div>
      </div>

      {params.get('bienvenue') && (
        <div style={{ marginBottom: '1.25rem' }}>
          <Alert kind="success" title="Votre compte est prêt">Commencez par déposer un cours en PDF : le résumé et les quiz seront prêts dans quelques minutes.</Alert>
        </div>
      )}

      {isNew ? (
        <div className="panel">
          <EmptyState icon={Upload} title="Déposez votre premier cours"
            action={<Button icon={Upload} onClick={openUpload}>Déposer un PDF</Button>}>
            Folio en tirera un résumé, une explication, un glossaire, une FAQ, des quiz et des fiches. Vous pourrez aussi lui poser vos questions.
          </EmptyState>
        </div>
      ) : (
        <>
          <div className="stat-strip" style={{ marginBottom: '1.25rem' }}>
            <Stat icon={Flame} label="Série actuelle" value={plural(data.streak.current, 'jour')} to="/app/progression" />
            <Stat icon={Layers} label="Fiches à réviser" value={data.flashcards.due} to="/app/fiches/revision" />
            <Stat icon={ListChecks} label="Score moyen aux quiz" value={data.quizzes.attempts ? `${data.quizzes.average} %` : '—'} to="/app/quiz" />
            <Stat icon={BookOpen} label="Documents prêts" value={`${data.documents.ready}/${data.documents.total}`} to="/app/bibliotheque" />
          </div>

          <div className="grid-main">
            <div className="stack" style={{ '--stack': '1.25rem' }}>
              {data.continue_reading.length > 0 && (
                <section className="panel">
                  <div className="panel__head"><h2>Reprendre</h2></div>
                  <div className="divider-list">
                    {data.continue_reading.map((d) => (
                      <Link key={d.id} to={`/app/documents/${d.id}`} className="list-row">
                        <DocIcon />
                        <div className="grow">
                          <div className="list-row__title truncate">{d.title}</div>
                          <div className="list-row__meta">Page {d.last_page} sur {d.page_count} · ouvert {timeAgo(d.last_opened_at)}</div>
                          <ProgressBar value={(100 * d.last_page) / Math.max(1, d.page_count)} label="Avancement" className="" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              <section className="panel">
                <div className="panel__head">
                  <h2>Cette semaine</h2>
                  <Button to="/app/concentration" variant="ghost" size="sm" icon={Target}>Lancer une session</Button>
                </div>
                <WeekBars week={data.week} goal={goal.daily_minutes} />
              </section>

              {data.score_trend.length > 1 && (
                <section className="panel">
                  <div className="panel__head"><h2>Scores aux quiz</h2><Link to="/app/quiz?onglet=historique" className="small">Historique</Link></div>
                  <ScoreTrend data={data.score_trend} />
                </section>
              )}

              {data.weak_documents.length > 0 && (
                <section className="panel">
                  <div className="panel__head"><h2>À retravailler</h2></div>
                  <div className="divider-list">
                    {data.weak_documents.map((d) => (
                      <Link key={d.id} to={`/app/documents/${d.id}/quiz`} className="list-row">
                        <span className="badge badge--coral">{d.average} %</span>
                        <span className="list-row__title grow truncate">{d.title}</span>
                        <ArrowUpRight size={16} color="var(--ink-3)" aria-hidden />
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <aside className="stack" style={{ '--stack': '1.25rem' }}>
              {data.flashcards.due > 0 && (
                <div className="panel" style={{ background: 'var(--highlight-soft)', borderColor: 'transparent' }}>
                  <strong>{plural(data.flashcards.due, 'fiche')} à réviser</strong>
                  <p className="small muted" style={{ margin: '0.25rem 0 0.75rem' }}>Quelques minutes suffisent pour ne pas les oublier.</p>
                  <Button to="/app/fiches/revision" size="sm" icon={Layers}>Réviser maintenant</Button>
                </div>
              )}

              <section className="panel">
                <div className="panel__head"><h2>Aujourd’hui</h2><Link to="/app/planning" className="small">Planning</Link></div>
                {data.tasks_today.length === 0 ? <p className="small muted" style={{ margin: 0 }}>Aucune tâche prévue.</p> : (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.5rem' }}>
                    {data.tasks_today.map((t) => (
                      <li key={t.id} className="row small">
                        <span className="dot" style={{ background: t.priority === 'high' ? 'var(--coral)' : 'var(--blue-line)' }} />
                        <span className="grow">{t.title}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {data.upcoming_exams.length > 0 && (
                <section className="panel">
                  <div className="panel__head"><h2>Examens</h2></div>
                  <div className="stack" style={{ '--stack': '0.6rem' }}>
                    {data.upcoming_exams.map((e) => (
                      <Link key={e.id} to={`/app/planning/examens/${e.id}`} className="row" style={{ color: 'var(--ink)', textDecoration: 'none' }}>
                        <CalendarClock size={18} color="var(--coral)" aria-hidden />
                        <span className="grow small" style={{ fontWeight: 500 }}>{e.title}</span>
                        <span className="badge badge--coral">{e.days_left === 0 ? 'Aujourd’hui' : `J-${e.days_left}`}</span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              <section className="panel">
                <div className="panel__head"><h2>Derniers dépôts</h2><Button variant="ghost" size="sm" icon={Upload} onClick={openUpload}>Ajouter</Button></div>
                <div className="divider-list">
                  {data.recent_documents.map((d) => (
                    <Link key={d.id} to={`/app/documents/${d.id}`} className="list-row">
                      <div className="grow">
                        <div className="list-row__title truncate">{d.title}</div>
                        <div className="list-row__meta">{timeAgo(d.created_at)}</div>
                      </div>
                      <StatusBadge status={d.status} />
                    </Link>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        </>
      )}
    </>
  )
}
