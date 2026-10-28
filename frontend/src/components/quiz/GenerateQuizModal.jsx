import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { quizzesApi } from '@/api'
import { Alert, Button, Input, Modal, Segmented, Select } from '@/components/ui'
import { DIFFICULTIES } from '@/utils/constants'

const KINDS = [
  { value: 'mixed', label: 'Mélangé' },
  { value: 'mcq', label: 'QCM' },
  { value: 'true_false', label: 'Vrai / faux' },
]

export function GenerateQuizModal({ open, onClose, documents = [], defaultDocument, onCreated }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ document: defaultDocument || '', count: 10, difficulty: 'moyen', kind: 'mixed', focus: '', timed: false, minutes: 10 })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const docId = defaultDocument || form.document

  const submit = async (e) => {
    e?.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const quiz = await quizzesApi.generate({
        document: Number(docId), count: Number(form.count), difficulty: form.difficulty,
        kinds: form.kind === 'mixed' ? ['mcq', 'true_false'] : [form.kind], focus: form.focus.trim(),
        time_limit_minutes: form.timed ? Number(form.minutes) : null,
      })
      onCreated?.(quiz)
      onClose()
      navigate(`/app/quiz/${quiz.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={loading ? undefined : onClose} title="Nouveau quiz" footer={<>
      <Button variant="secondary" onClick={onClose} disabled={loading}>Annuler</Button>
      <Button icon={Sparkles} onClick={submit} loading={loading} disabled={!docId}>{loading ? 'Génération…' : 'Générer et commencer'}</Button>
    </>}>
      <form onSubmit={submit} className="stack">
        {error && <Alert kind="error">{error}</Alert>}
        {!defaultDocument && (
          <Select label="Document" placeholder="Choisir un document" value={form.document} onChange={(e) => set('document', e.target.value)}
            options={documents.map((d) => ({ value: d.id, label: d.title }))} />
        )}
        <Input label="Thème précis (facultatif)" placeholder="ex. normalisation, chapitre 3, transactions…" value={form.focus}
          onChange={(e) => set('focus', e.target.value)} hint="Laissez vide pour couvrir tout le document." />
        <div className="form-grid">
          <Select label="Nombre de questions" value={form.count} onChange={(e) => set('count', e.target.value)}
            options={[5, 10, 15, 20, 30].map((n) => ({ value: n, label: `${n} questions` }))} />
          <Select label="Difficulté" value={form.difficulty} onChange={(e) => set('difficulty', e.target.value)} options={DIFFICULTIES} />
        </div>
        <div className="field">
          <span className="field__label">Type de questions</span>
          <Segmented options={KINDS} value={form.kind} onChange={(v) => set('kind', v)} label="Type de questions" />
        </div>
        <label className="checkbox">
          <input type="checkbox" checked={form.timed} onChange={(e) => set('timed', e.target.checked)} />
          <span>Chronométré, comme en examen</span>
        </label>
        {form.timed && <Input label="Durée (minutes)" type="number" min={1} max={180} value={form.minutes} onChange={(e) => set('minutes', e.target.value)} />}
        {loading && <p className="small muted" style={{ margin: 0 }}>Folio rédige les questions à partir du document. Cela peut prendre une minute.</p>}
      </form>
    </Modal>
  )
}
