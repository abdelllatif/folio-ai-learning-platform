import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BookOpen, CreditCard, FileText, HelpCircle, ListChecks, LogOut, Menu as MenuIcon,
  MessagesSquare, Moon, NotebookPen, Search, Sun, Timer, Upload, User,
} from 'lucide-react'
import { analyticsApi, systemApi } from '@/api'
import { Button, Menu } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { formatClock, useTimer } from '@/context/TimerContext'
import { useClickOutside, useDebounce } from '@/hooks/misc'
import { useApi } from '@/hooks/useApi'

export function Avatar({ user, large }) {
  const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase() || '?'
  return (
    <span className={`avatar ${large ? 'avatar--lg' : ''}`} aria-hidden>
      {user?.avatar ? <img src={user.avatar} alt="" /> : initials}
    </span>
  )
}

function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState(null)
  const debounced = useDebounce(query, 250)
  const ref = useRef(null)
  const inputRef = useRef(null)
  const close = useCallback(() => setOpen(false), [])
  useClickOutside(ref, close, open)

  useEffect(() => {
    if (debounced.trim().length < 2) { setResults(null); return }
    let alive = true
    analyticsApi.search(debounced).then((r) => alive && setResults(r)).catch(() => alive && setResults(null))
    return () => { alive = false }
  }, [debounced])

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); inputRef.current?.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const groups = results && [
    { key: 'documents', label: 'Documents', icon: FileText, to: (r) => `/app/documents/${r.id}` },
    { key: 'notes', label: 'Notes', icon: NotebookPen, to: () => '/app/notes', text: (r) => r.title || r.content?.slice(0, 60) },
    { key: 'quizzes', label: 'Quiz', icon: ListChecks, to: (r) => `/app/quiz/${r.id}` },
    { key: 'conversations', label: 'Conversations', icon: MessagesSquare, to: (r) => `/app/documents/${r.document_id}/assistant?c=${r.id}` },
  ].filter((g) => results[g.key]?.length)

  return (
    <div className="topbar__search" ref={ref}>
      <div className="input-group">
        <Search aria-hidden />
        <input ref={inputRef} className="input" type="search" placeholder="Rechercher dans vos cours, notes, quiz…"
          aria-label="Recherche globale (Ctrl+K)" value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }} onFocus={() => setOpen(true)} />
      </div>
      {open && debounced.trim().length >= 2 && results && (
        <div className="search-results" onClick={() => { setOpen(false); setQuery('') }}>
          {groups.length === 0 && <p className="small muted" style={{ padding: '0.6rem' }}>Aucun résultat pour « {debounced} ».</p>}
          {groups.map((g) => (
            <div key={g.key}>
              <h5>{g.label}</h5>
              {results[g.key].map((r) => (
                <Link key={r.id} to={g.to(r)}><g.icon aria-hidden /><span className="truncate">{g.text ? g.text(r) : r.title}</span></Link>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function Topbar({ onMenu, onUpload }) {
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const timer = useTimer()
  const navigate = useNavigate()
  const health = useApi(() => systemApi.health(), [])
  const llmOnline = health.data?.llm?.available

  return (
    <header className="topbar">
      <Button variant="ghost" size="sm" iconOnly icon={MenuIcon} className="topbar__menu-btn" onClick={onMenu} aria-label="Ouvrir le menu" />
      <GlobalSearch />
      <div className="topbar__actions">
        {health.data && (
          <span className={`badge ${llmOnline ? 'badge--mint' : 'badge--amber'}`}
            title={llmOnline ? `Modèle ${health.data.llm.model} disponible` : 'Le modèle local est hors ligne : Folio utilise des extraits du document.'}>
            <span className="dot" style={{ background: 'currentColor' }} />{llmOnline ? 'IA active' : 'Mode extraits'}
          </span>
        )}
        {(timer.running || timer.remaining !== timer.total) && (
          <Link to="/app/concentration" className="timer-pill" aria-label="Minuteur de concentration">
            <Timer aria-hidden />{formatClock(timer.remaining)}
          </Link>
        )}
        <Button size="sm" icon={Upload} onClick={onUpload}>Déposer un PDF</Button>
        <Button variant="ghost" size="sm" iconOnly icon={theme === 'dark' ? Sun : Moon} onClick={toggle}
          aria-label={theme === 'dark' ? 'Passer au thème clair' : 'Passer au thème sombre'} />
        <Menu label="Mon compte"
          trigger={<button type="button" className="btn btn--ghost btn--icon btn--sm" aria-label="Mon compte" style={{ padding: 0 }}><Avatar user={user} /></button>}
          items={[
            { label: user?.full_name || 'Mon profil', icon: User, to: '/app/parametres' },
            { label: 'Bibliothèque', icon: BookOpen, to: '/app/bibliotheque' },
            { label: 'Abonnement', icon: CreditCard, to: '/app/abonnement' },
            { label: 'Aide', icon: HelpCircle, to: '/app/aide' },
            { label: 'Se déconnecter', icon: LogOut, danger: true, onClick: async () => { await logout(); navigate('/connexion') } },
          ]} />
      </div>
    </header>
  )
}
