import { Link } from 'react-router-dom'
import { Award, Lock } from 'lucide-react'
import { analyticsApi } from '@/api'
import { Heatmap } from '@/components/charts/Heatmap'
import { ScoreTrend } from '@/components/charts/ScoreTrend'
import { EmptyState, ErrorState, ProgressBar, Skeleton } from '@/components/ui'
import { useApi } from '@/hooks/useApi'
import { usePageTitle } from '@/hooks/misc'
import { formatMinutes, plural, scoreTone } from '@/utils/format'

export function Progress() {
  usePageTitle('Progression')
  const dash = useApi(() => analyticsApi.dashboard(), [])
  const activity = useApi(() => analyticsApi.activity(182), [])
  const mastery = useApi(() => analyticsApi.progress(), [])

  if (dash.error) return <ErrorState error={dash.error} onRetry={dash.reload} />
  if (dash.loading) return <div className="stack"><Skeleton height={100} /><Skeleton height={200} /></div>
  const d = dash.data
  const totalMinutes = (activity.data || []).reduce((n, x) => n + x.minutes, 0)
  const activeDays = (activity.data || []).filter((x) => x.count > 0).length

  return (
    <>
      <div className="page-head"><div><h1>Progression</h1><p>Ce que vous avez accompli, et ce qu’il reste à consolider.</p></div></div>

      <div className="stat-strip" style={{ marginBottom: '1.25rem' }}>
        <div className="stat"><span className="stat__label">Série actuelle</span><span className="stat__value">{plural(d.streak.current, 'jour')}</span><span className="tiny muted">Record : {plural(d.streak.longest, 'jour')}</span></div>
        <div className="stat"><span className="stat__label">Temps d’étude (6 mois)</span><span className="stat__value">{formatMinutes(totalMinutes)}</span><span className="tiny muted">{plural(activeDays, 'jour actif', 'jours actifs')}</span></div>
        <div className="stat"><span className="stat__label">Quiz terminés</span><span className="stat__value">{d.quizzes.attempts}</span><span className="tiny muted">Moyenne {d.quizzes.average} %</span></div>
        <div className="stat"><span className="stat__label">Fiches maîtrisées</span><span className="stat__value">{d.flashcards.mastered}/{d.flashcards.total}</span><span className="tiny muted">{d.flashcards.reviews} révisions</span></div>
      </div>

      <section className="panel" style={{ marginBottom: '1.25rem' }}>
        <div className="panel__head"><h2>Activité des 6 derniers mois</h2>
          <span className="row tiny muted" aria-hidden>Moins <span className="heat-legend">{[0, 1, 2, 3, 4].map((l) => <span key={l} data-l={l} />)}</span> Plus</span>
        </div>
        {activity.data ? <Heatmap series={activity.data} /> : <Skeleton height={110} />}
      </section>

      <div className="grid-2" style={{ marginBottom: '1.25rem', alignItems: 'start' }}>
        <section className="panel">
          <div className="panel__head"><h2>Maîtrise par document</h2></div>
          {mastery.data?.length === 0 && <EmptyState title="Rien à mesurer pour l’instant">Faites un quiz ou révisez des fiches pour voir votre maîtrise.</EmptyState>}
          <div className="divider-list">
            {mastery.data?.map((m) => (
              <Link key={m.id} to={`/app/documents/${m.id}`} className="list-row" style={{ display: 'block' }}>
                <div className="row-between">
                  <span className="list-row__title truncate">{m.subject_color && <span className="dot" style={{ background: m.subject_color, marginRight: 6 }} />}{m.title}</span>
                  <span className="small" style={{ fontWeight: 600 }}>{m.mastery} %</span>
                </div>
                <ProgressBar value={m.mastery} tone={scoreTone(m.mastery) === 'neutral' ? undefined : scoreTone(m.mastery)} label={`Maîtrise de ${m.title}`} />
                <div className="list-row__meta" style={{ marginTop: 4 }}>
                  {m.quiz_attempts ? `Quiz ${m.quiz_average} % (${m.quiz_attempts})` : 'Pas de quiz'} · {m.cards_total ? `${m.cards_mastered}/${m.cards_total} fiches` : 'Pas de fiches'} · {plural(m.notes, 'note')}
                </div>
              </Link>
            ))}
          </div>
        </section>
        <section className="panel">
          <div className="panel__head"><h2>Scores aux quiz</h2></div>
          {d.score_trend.length > 1 ? <ScoreTrend data={d.score_trend} height={240} /> : <p className="small muted">Le graphique apparaît après deux quiz.</p>}
        </section>
      </div>

      <section>
        <h2 style={{ fontSize: 'var(--fs-md)' }}>Badges</h2>
        <div className="badges">
          {d.badges.map((b) => (
            <div key={b.code} className={`badge-card ${b.earned ? '' : 'locked'}`}>
              <span className="badge-card__ico">{b.earned ? <Award aria-hidden /> : <Lock aria-hidden />}</span>
              <div><div className="small" style={{ fontWeight: 600 }}>{b.title}</div><div className="tiny muted">{b.description}</div></div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
