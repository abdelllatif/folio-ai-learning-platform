import { Link } from 'react-router-dom'
import { Play, RotateCcw, Trash2 } from 'lucide-react'
import { Button, Menu } from '@/components/ui'
import { DIFFICULTIES } from '@/utils/constants'
import { formatDate, formatDuration, scoreTone, timeAgo } from '@/utils/format'

const difficultyLabel = (v) => DIFFICULTIES.find((d) => d.value === v)?.label || v

export const ScoreBadge = ({ percent }) =>
  percent == null ? <span className="muted">—</span> : <span className={`badge badge--${scoreTone(percent)}`}>{Math.round(percent)} %</span>

export function QuizTable({ quizzes, onDelete, showDocument = true }) {
  return (
    <div className="panel panel--flush table-wrap">
      <table className="table">
        <thead><tr>
          <th>Quiz</th>{showDocument && <th>Document</th>}<th>Questions</th><th>Difficulté</th><th>Meilleur</th><th>Dernier</th><th><span className="sr-only">Actions</span></th>
        </tr></thead>
        <tbody>
          {quizzes.map((q) => (
            <tr key={q.id}>
              <td style={{ maxWidth: 320 }}>
                <Link to={`/app/quiz/${q.id}`} className="truncate" style={{ display: 'block', fontWeight: 500, color: 'var(--ink)' }}>{q.focus || 'Tout le document'}</Link>
                <span className="tiny muted">{q.attempt_count ? `${q.attempt_count} tentative${q.attempt_count > 1 ? 's' : ''}` : 'Jamais fait'} · {timeAgo(q.created_at)}</span>
              </td>
              {showDocument && <td className="truncate" style={{ maxWidth: 220 }}><Link to={`/app/documents/${q.document}`} style={{ color: 'var(--ink-2)' }}>{q.document_title}</Link></td>}
              <td>{q.question_count}{q.time_limit_minutes ? ` · ${q.time_limit_minutes} min` : ''}</td>
              <td>{difficultyLabel(q.difficulty)}</td>
              <td><ScoreBadge percent={q.best_percent} /></td>
              <td><ScoreBadge percent={q.last_percent} /></td>
              <td className="nowrap">
                <Button to={`/app/quiz/${q.id}`} size="sm" variant="secondary" icon={Play}>{q.attempt_count ? 'Refaire' : 'Commencer'}</Button>
                <Menu items={[
                  q.attempt_count > 0 && q.last_percent < 100 && { label: 'Revoir mes erreurs', icon: RotateCcw, to: `/app/quiz/${q.id}?mode=erreurs` },
                  onDelete && { label: 'Supprimer', icon: Trash2, danger: true, onClick: () => onDelete(q) },
                ]} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function AttemptTable({ attempts }) {
  return (
    <div className="panel panel--flush table-wrap">
      <table className="table">
        <thead><tr><th>Date</th><th>Quiz</th><th>Mode</th><th>Score</th><th>Durée</th><th><span className="sr-only">Correction</span></th></tr></thead>
        <tbody>
          {attempts.map((a) => (
            <tr key={a.id}>
              <td className="nowrap">{formatDate(a.completed_at)}</td>
              <td style={{ maxWidth: 360 }}><span className="truncate" style={{ display: 'block' }}>{a.quiz_title}</span></td>
              <td>{a.mode === 'mistakes' ? 'Erreurs' : 'Complet'}</td>
              <td><ScoreBadge percent={a.percent} /> <span className="tiny muted">{a.score}/{a.total}</span></td>
              <td>{a.duration_seconds ? formatDuration(a.duration_seconds) : '—'}</td>
              <td><Link to={`/app/tentatives/${a.id}`} className="small">Voir la correction</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
