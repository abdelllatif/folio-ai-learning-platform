/** GitHub-style activity grid: one square per day, columns are weeks. */
export function Heatmap({ series = [] }) {
  if (!series.length) return null
  const max = Math.max(...series.map((d) => d.count), 1)
  const level = (c) => (c === 0 ? 0 : Math.min(4, Math.ceil((c / max) * 4)))
  // pad the start so the first column begins on Monday
  const first = new Date(`${series[0].date}T12:00:00`)
  const pad = (first.getDay() + 6) % 7
  const fmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' })
  return (
    <div className="heatmap" role="img" aria-label={`Activité des ${series.length} derniers jours`}>
      {Array.from({ length: pad }, (_, i) => <span key={`p${i}`} style={{ visibility: 'hidden' }} />)}
      {series.map((d) => (
        <span key={d.date} data-l={level(d.count)}
          title={`${fmt.format(new Date(`${d.date}T12:00:00`))} : ${d.count} activité${d.count > 1 ? 's' : ''}${d.minutes ? `, ${d.minutes} min` : ''}`} />
      ))}
    </div>
  )
}
