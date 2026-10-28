import { useEffect, useState } from 'react'
import { subjectsApi } from '@/api'
import { fieldErrors } from '@/api/client'
import { Button, Input, Modal } from '@/components/ui'
import { useToast } from '@/context/ToastContext'
import { SUBJECT_COLORS } from '@/utils/constants'

export function SubjectModal({ open, onClose, subject, onSaved }) {
  const toast = useToast()
  const [name, setName] = useState('')
  const [color, setColor] = useState(SUBJECT_COLORS[0])
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) { setName(subject?.name || ''); setColor(subject?.color || SUBJECT_COLORS[0]); setError(null) }
  }, [open, subject])

  const save = async (e) => {
    e?.preventDefault()
    setSaving(true)
    try {
      const saved = subject ? await subjectsApi.update(subject.id, { name, color }) : await subjectsApi.create({ name, color })
      toast.success(subject ? 'Matière renommée.' : 'Matière créée.')
      onSaved?.(saved)
      onClose()
    } catch (err) {
      setError(fieldErrors(err).name || err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={subject ? 'Modifier la matière' : 'Nouvelle matière'}
      footer={<><Button variant="secondary" onClick={onClose}>Annuler</Button><Button onClick={save} loading={saving} disabled={!name.trim()}>Enregistrer</Button></>}>
      <form onSubmit={save} className="stack">
        <Input label="Nom" placeholder="ex. Bases de données" value={name} onChange={(e) => setName(e.target.value)} error={error} />
        <div className="field">
          <span className="field__label">Couleur</span>
          <div className="color-dots" role="group" aria-label="Couleur">
            {SUBJECT_COLORS.map((c) => (
              <button key={c} type="button" style={{ background: c }} aria-pressed={c === color} aria-label={c} onClick={() => setColor(c)} />
            ))}
          </div>
        </div>
      </form>
    </Modal>
  )
}
