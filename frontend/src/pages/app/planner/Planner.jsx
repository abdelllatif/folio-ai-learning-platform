import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, CalendarPlus, Plus, Trash2 } from 'lucide-react'
import { documentsApi, plannerApi } from '@/api'
import { Button, EmptyState, Input, Modal, Segmented, Select, SkeletonList } from '@/components/ui'
import { useToast } from '@/context/ToastContext'
import { useApi } from '@/hooks/useApi'
import { usePageTitle } from '@/hooks/misc'
import { formatDay, formatShortDate, isoDate } from '@/utils/format'

const PRIORITIES = [{ value: 'low', label: 'Basse' }, { value: 'normal', label: 'Normale' }, { value: 'high', label: 'Haute' }]

function ExamModal({ open, onClose, documents, onSaved }) {
  const toast = useToast()
  const [form, setForm] = useState({ title: '', date: '', location: '', documents: [], daily_minutes: 60 })
  const [saving, setSaving] = useState(false)
  const toggleDoc = (id) => setForm((f) => ({ ...f, documents: f.documents.includes(id) ? f.documents.filter((d) => d !== id) : [...f.documents, id] }))

  const save = async () => {
    setSaving(true)
    try {
      const exam = await plannerApi.createExam({ ...form, daily_minutes: Number(form.daily_minutes) })
      toast.success('Examen ajouté. Votre planning de révision est prêt.')
      onSaved(exam); onClose()
      setForm({ title: '', date: '', location: '', documents: [], daily_minutes: 60 })
    } catch (err) { toast.error(err) } finally { setSaving(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Ajouter un examen" wide footer={<>
      <Button variant="secondary" onClick={onClose}>Annuler</Button>
      <Button onClick={save} loading={saving} disabled={!form.title.trim() || !form.date}>Ajouter et planifier</Button></>}>
      <div className="stack">
        <div className="form-grid">
          <Input label="Intitulé" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="ex. Partiel de bases de données" />
          <Input label="Date" type="date" min={isoDate()} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Input label="Lieu (facultatif)" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <Select label="Temps de révision par jour" value={form.daily_minutes} onChange={(e) => setForm({ ...form, daily_minutes: e.target.value })}
            options={[30, 45, 60, 90, 120, 180].map((m) => ({ value: m, label: `${m} min` }))} />
        </div>
        <div className="field">
          <span className="field__label">Documents au programme</span>
          {documents.length === 0 ? <span className="small muted">Aucun document prêt.</span> : (
            <div className="row wrap">
              {documents.map((d) => (
                <button key={d.id} type="button" className="chip" aria-pressed={form.documents.includes(d.id)}
                  style={form.documents.includes(d.id) ? { background: 'var(--blue-soft)', borderColor: 'var(--blue)', color: 'var(--blue)' } : undefined}
                  onClick={() => toggleDoc(d.id)}>{d.title}</button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

export function Planner() {
  usePageTitle('Planning')
  const toast = useToast()
  const [view, setView] = useState('today')
  const exams = useApi(() => plannerApi.exams({ upcoming: 1 }), [])
  const tasks = useApi(() => plannerApi.tasks({ page_size: 100, ...(view === 'all' ? {} : view === 'done' ? { is_done: true } : { when: view }) }), [view])
  const docs = useApi(() => documentsApi.list({ status: 'ready', page_size: 100 }), [])
  const [examOpen, setExamOpen] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', due_date: isoDate(), priority: 'normal' })

  const addTask = async (e) => {
    e.preventDefault()
    if (!newTask.title.trim()) return
    try {
      await plannerApi.createTask({ ...newTask, due_date: newTask.due_date || null })
      setNewTask((t) => ({ ...t, title: '' }))
      tasks.reload()
    } catch (err) { toast.error(err) }
  }
  const toggle = async (t) => {
    tasks.setData((d) => ({ ...d, results: d.results.map((x) => (x.id === t.id ? { ...x, is_done: !x.is_done } : x)) }))
    await plannerApi.updateTask(t.id, { is_done: !t.is_done }).catch((err) => { toast.error(err); tasks.reload() })
  }
  const removeTask = async (t) => {
    await plannerApi.removeTask(t.id)
    tasks.setData((d) => ({ ...d, results: d.results.filter((x) => x.id !== t.id) }))
  }

  const today = isoDate()
  return (
    <>
      <div className="page-head">
        <div><h1>Planning & examens</h1><p>Vos échéances, et ce qu’il reste à faire pour être prêt.</p></div>
        <Button icon={CalendarPlus} onClick={() => setExamOpen(true)}>Ajouter un examen</Button>
      </div>

      <div className="grid-main">
        <section className="panel">
          <div className="panel__head">
            <h2>Tâches</h2>
            <Segmented value={view} onChange={setView} label="Afficher"
              options={[{ value: 'today', label: 'Aujourd’hui' }, { value: 'overdue', label: 'En retard' }, { value: 'upcoming', label: 'À venir' }, { value: 'all', label: 'Toutes' }, { value: 'done', label: 'Faites' }]} />
          </div>
          <form onSubmit={addTask} className="row wrap" style={{ marginBottom: '0.75rem' }}>
            <input className="input grow" style={{ minWidth: 200 }} placeholder="Ajouter une tâche, ex. relire le chapitre 3" aria-label="Nouvelle tâche"
              value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} />
            <input className="input" type="date" style={{ width: 160 }} aria-label="Échéance" value={newTask.due_date} onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })} />
            <select className="select" style={{ width: 120 }} aria-label="Priorité" value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}>
              {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <Button type="submit" icon={Plus} disabled={!newTask.title.trim()}>Ajouter</Button>
          </form>
          {tasks.loading && !tasks.data && <SkeletonList rows={3} />}
          {tasks.data?.results?.length === 0 && <p className="small muted" style={{ padding: '1rem 0' }}>{view === 'today' ? 'Rien de prévu aujourd’hui.' : 'Aucune tâche ici.'}</p>}
          <div className="divider-list">
            {tasks.data?.results?.map((t) => (
              <div key={t.id} className={`task ${t.is_done ? 'done' : ''}`}>
                <input type="checkbox" checked={t.is_done} onChange={() => toggle(t)} aria-label={`Marquer « ${t.title} » comme faite`} />
                <div className="grow">
                  <div className="task__title">{t.title}</div>
                  <div className="tiny muted">
                    {t.due_date && <span style={!t.is_done && t.due_date < today ? { color: 'var(--coral)' } : undefined}>{formatShortDate(t.due_date)}</span>}
                    {t.document_title && <> · <Link to={`/app/documents/${t.document}`}>{t.document_title}</Link></>}
                  </div>
                </div>
                {t.priority === 'high' && <span className="badge badge--coral">Priorité</span>}
                <Button variant="ghost" size="sm" iconOnly icon={Trash2} aria-label="Supprimer la tâche" onClick={() => removeTask(t)} />
              </div>
            ))}
          </div>
        </section>

        <aside className="stack" style={{ '--stack': '0.75rem' }}>
          <h2 style={{ fontSize: 'var(--fs-md)', margin: 0 }}>Examens à venir</h2>
          {exams.loading && <SkeletonList rows={2} />}
          {exams.data?.results?.length === 0 && (
            <div className="panel"><EmptyState icon={CalendarClock} title="Aucun examen" action={<Button size="sm" onClick={() => setExamOpen(true)}>Ajouter un examen</Button>}>
              Folio prépare un planning jour par jour jusqu’à la date.
            </EmptyState></div>
          )}
          {exams.data?.results?.map((e) => (
            <Link key={e.id} to={`/app/planning/examens/${e.id}`} className="exam-card">
              <div className="countdown"><div><strong>{e.days_left}</strong><small>{e.days_left > 1 ? 'jours' : 'jour'}</small></div></div>
              <div className="grow">
                <div style={{ fontWeight: 600 }}>{e.title}</div>
                <div className="tiny muted" style={{ textTransform: 'capitalize' }}>{formatDay(e.date)}{e.location && ` · ${e.location}`}</div>
                <div className="tiny muted">{e.documents.length} document{e.documents.length > 1 ? 's' : ''} au programme</div>
              </div>
            </Link>
          ))}
        </aside>
      </div>
      <ExamModal open={examOpen} onClose={() => setExamOpen(false)} documents={docs.data?.results || []} onSaved={() => exams.reload()} />
    </>
  )
}
