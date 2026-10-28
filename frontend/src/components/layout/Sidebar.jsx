import { NavLink } from 'react-router-dom'
import {
  BarChart3, BookOpen, CalendarDays, HelpCircle, Layers, LayoutDashboard, ListChecks,
  MessagesSquare, NotebookPen, Settings, Timer,
} from 'lucide-react'
import { Logo, ProgressBar } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { useApi } from '@/hooks/useApi'
import { flashcardsApi } from '@/api'
import { useInterval } from '@/hooks/misc'

const GROUPS = [
  {
    label: 'Étudier',
    links: [
      { to: '/app', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
      { to: '/app/bibliotheque', label: 'Bibliothèque', icon: BookOpen },
      { to: '/app/assistant', label: 'Assistant', icon: MessagesSquare },
      { to: '/app/quiz', label: 'Quiz', icon: ListChecks },
      { to: '/app/fiches', label: 'Fiches de révision', icon: Layers, due: true },
      { to: '/app/notes', label: 'Notes', icon: NotebookPen },
    ],
  },
  {
    label: 'S’organiser',
    links: [
      { to: '/app/planning', label: 'Planning & examens', icon: CalendarDays },
      { to: '/app/concentration', label: 'Concentration', icon: Timer },
      { to: '/app/progression', label: 'Progression', icon: BarChart3 },
    ],
  },
  {
    label: 'Compte',
    links: [
      { to: '/app/parametres', label: 'Paramètres', icon: Settings },
      { to: '/app/aide', label: 'Aide', icon: HelpCircle },
    ],
  },
]

export function Sidebar({ open }) {
  const { user } = useAuth()
  const due = useApi(() => flashcardsApi.due({ limit: 200 }).then((c) => c.length), [])
  useInterval(due.reload, 5 * 60 * 1000)
  const usage = user?.usage

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`} aria-label="Navigation de l’espace étudiant">
      <div className="sidebar__logo"><Logo to="/app" /></div>
      {GROUPS.map((group) => (
        <nav key={group.label} className="sidebar__group" aria-label={group.label}>
          <div className="sidebar__label">{group.label}</div>
          {group.links.map(({ to, label, icon: Icon, end, due: showDue }) => (
            <NavLink key={to} to={to} end={end} className="side-link">
              <Icon aria-hidden />{label}
              {showDue && due.data > 0 && <span className="count" aria-label={`${due.data} fiches à réviser`}>{due.data}</span>}
            </NavLink>
          ))}
        </nav>
      ))}

      {usage && (
        <div className="sidebar__foot">
          <div className="plan-card">
            {user.plan === 'pro' ? (
              <><strong>Étudiant Pro</strong><p className="muted tiny" style={{ margin: '0.2rem 0 0' }}>Documents illimités · fichiers jusqu’à {usage.max_file_mb} Mo</p></>
            ) : (
              <>
                <div className="row-between"><strong>Offre gratuite</strong><span className="tiny muted">{usage.documents_used}/{usage.documents_limit}</span></div>
                <ProgressBar value={(100 * usage.documents_used) / usage.documents_limit}
                  tone={usage.documents_used >= usage.documents_limit ? 'coral' : undefined} label="Documents utilisés" />
                <NavLink to="/app/abonnement" className="small" style={{ fontWeight: 500 }}>Passer à Étudiant Pro</NavLink>
              </>
            )}
          </div>
        </div>
      )}
    </aside>
  )
}
