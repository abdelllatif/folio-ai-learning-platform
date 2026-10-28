import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatShortDate } from '@/utils/format'

export function ScoreTrend({ data = [], height = 200 }) {
  const points = data.map((d) => ({ ...d, label: formatShortDate(d.date) }))
  return (
    <div style={{ width: '100%', height }} role="img" aria-label="Évolution des scores aux quiz">
      <ResponsiveContainer>
        <LineChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
          <CartesianGrid stroke="var(--line)" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--ink-3)' }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} ticks={[0, 50, 100]} tick={{ fontSize: 11, fill: 'var(--ink-3)' }} axisLine={false} tickLine={false} />
          <ReferenceLine y={80} stroke="var(--mint)" strokeDasharray="4 4" />
          <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8, fontSize: 12 }}
            formatter={(v) => [`${v} %`, 'Score']} labelFormatter={(_, p) => p?.[0]?.payload?.quiz || ''} />
          <Line type="monotone" dataKey="percent" stroke="var(--blue)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--blue)' }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
