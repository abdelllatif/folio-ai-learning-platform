import { useEffect, useState } from 'react'
import { notesApi } from '@/api'
import { fieldErrors } from '@/api/client'
import { Alert, Button, Input, Modal, Select, Textarea } from '@/components/ui'
import { useToast } from '@/context/ToastContext'
import { NOTE_COLORS } from '@/utils/constants'

const EMPTY = { title: '', quote: '', content: '', color: 'plain', tags: '', page: '', document: '', is_pinned: false }

export function NoteEditor({ open, onClose, note, documents = [], defaultDocument, defaultPage, onSaved }) {
  const toast = useToast()
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setError(null)
    setForm(note ? { ...EMPTY, ...note, tags: (note.tags || []).join(', '), page: note.page ?? '', document: note.document ?? '' }
      : { ...EMPTY, document: defaultDocument ?? '', page: defaultPage ?? '' })
  }, [open, note, defaultDocument, defaultPage])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const save = async () => {
    setSaving(true); setError(null)
    const payload = {
      title: form.title, quote: form.quote, content: form.content, color: form.color, is_pinned: form.is_pinned,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      page: form.page ? Number(form.page) : null, document: form.document ? Number(form.document) : null,
    }
    try {
      const saved = note?.id ? await notesApi.update(note.id, payload) : await notesApi.create(payload)
      toast.success(note?.id ? 'Note enregistrée.' : 'Note créée.')
      onSaved?.(saved)
      onClose()
    } catch (err) {
      const fe = fieldErrors(err)
      setError(fe.non_field_errors || Object.values(fe)[0] || err.message)
    } finally { setSaving(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title={note?.id ? 'Modifier la note' : 'Nouvelle note'} wide
      footer={<><Button variant="secondary" onClick={onClose}>Annuler</Button><Button onClick={save} loading={saving}>Enregistrer</Button></>}>
      <div className="stack">
        {error && <Alert kind="error">{error}</Alert>}
        <Input label="Titre" value={form.title} onChange={set('title')} placeholder="ex. À revoir avant le partiel" />
        {(form.quote || note?.quote) && <Textarea label="Passage du cours" value={form.quote} onChange={set('quote')} rows={3} />}
        <Textarea label="Vos notes" value={form.content} onChange={set('content')} rows={7} placeholder="Ce que vous avez compris, vos questions, vos moyens mnémotechniques…" />
        <div className="form-grid">
          {!defaultDocument && (
            <Select label="Document lié" placeholder="Aucun" value={form.document} onChange={set('document')}
              options={documents.map((d) => ({ value: d.id, label: d.title }))} />
          )}
          <Input label="Page" type="number" min={1} value={form.page} onChange={set('page')} />
          <Input label="Étiquettes" value={form.tags} onChange={set('tags')} placeholder="partiel, chapitre 2" hint="Séparées par des virgules" />
          <div className="field">
            <span className="field__label">Couleur</span>
            <div className="color-dots" role="group" aria-label="Couleur">
              {NOTE_COLORS.map((c) => (
                <button key={c.value} type="button" aria-label={c.label} aria-pressed={form.color === c.value}
                  style={{ background: c.value === 'plain' ? 'var(--surface)' : `var(--note-${c.value})` }}
                  onClick={() => setForm((f) => ({ ...f, color: c.value }))} />
              ))}
            </div>
          </div>
        </div>
        <label className="checkbox"><input type="checkbox" checked={form.is_pinned} onChange={(e) => setForm((f) => ({ ...f, is_pinned: e.target.checked }))} /><span>Épingler en haut</span></label>
      </div>
    </Modal>
  )
}
