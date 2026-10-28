import { isoDate } from '@/utils/format'

const DAY = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' })

/** Minutes studied per day this week, against the daily goal. */
export function WeekBars({ week = [], goal = 45 }) {
  const today = isoDate()
  const max = Math.max(goal, ...week.map((d) => d.minutes), 1)
  return (
    <div className="week-bars" role="img"
      aria-label={`Minutes d’étude cette semaine : ${week.map((d) => `${DAY.format(new Date(d.date))} ${d.minutes}`).join(', ')}`}>
      {week.map((d) => {
        const cls = d.minutes >= goal ? 'met' : d.date === today ? 'today' : ''
        return (
          <div key={d.date} className="week-bars__col" title={`${d.minutes} min`}>
            <div className={`week-bars__bar ${cls}`} style={{ height: `${(d.minutes / max) * 100}%` }} />
            <span className="week-bars__label">{DAY.format(new Date(`${d.date}T12:00:00`)).replace('.', '')}</span>
          </div>
        )
      })}
    </div>
  )
}
