import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, CheckCircle2, UploadCloud } from 'lucide-react'
import { documentsApi, subjectsApi } from '@/api'
import { Button, Modal, ProgressBar, Select } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { useApi } from '@/hooks/useApi'
import { formatBytes } from '@/utils/format'

export const notifyDocumentsChanged = () => window.dispatchEvent(new Event('folio:documents-changed'))

export function UploadModal({ open, onClose }) {
  const { user, refreshUser } = useAuth()
  const subjects = useApi(() => subjectsApi.list(), [open], { enabled: open })
  const [items, setItems] = useState([])
  const [subjectId, setSubjectId] = useState('')
  const [drag, setDrag] = useState(false)
  const [busy, setBusy] = useState(false)
  const inputRef = useRef(null)
  const maxMb = user?.usage?.max_file_mb || 25

  const addFiles = (fileList) => {
    const next = Array.from(fileList).map((file) => {
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
      const tooBig = file.size > maxMb * 1024 * 1024
      return {
        id: `${file.name}-${file.size}-${Math.random()}`, file, progress: 0,
        status: !isPdf || tooBig ? 'error' : 'queued',
        error: !isPdf ? 'Seuls les PDF sont acceptés.' : tooBig ? `Plus de ${maxMb} Mo.` : null,
      }
    })
    setItems((cur) => [...cur.filter((i) => i.status !== 'done'), ...next])
  }

  const update = (id, patch) => setItems((cur) => cur.map((i) => (i.id === id ? { ...i, ...patch } : i)))

  const uploadAll = async () => {
    setBusy(true)
    for (const item of items.filter((i) => i.status === 'queued')) {
      update(item.id, { status: 'uploading' })
      try {
        const doc = await documentsApi.upload(item.file, subjectId || null, (p) => update(item.id, { progress: p }))
        update(item.id, { status: 'done', progress: 100, doc })
      } catch (err) {
        update(item.id, { status: 'error', error: err.message, quota: err.code === 'quota_exceeded' })
        if (err.code === 'quota_exceeded') break
      }
    }
    setBusy(false)
    notifyDocumentsChanged()
    refreshUser().catch(() => {})
  }

  const close = () => { if (!busy) { setItems([]); onClose() } }
  const queued = items.filter((i) => i.status === 'queued').length
  const done = items.filter((i) => i.status === 'done')

  return (
    <Modal open={open} onClose={close} title="Déposer des cours" footer={<>
      <Button variant="secondary" onClick={close} disabled={busy}>{done.length ? 'Fermer' : 'Annuler'}</Button>
      <Button icon={UploadCloud} onClick={uploadAll} loading={busy} disabled={!queued}>
        {queued > 1 ? `Déposer ${queued} fichiers` : 'Déposer'}
      </Button>
    </>}>
      <div className="stack">
        <div className={`dropzone ${drag ? 'drag' : ''}`} role="button" tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click() }}
          onDragOver={(e) => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files) }}>
          <UploadCloud aria-hidden />
          <strong>Glissez vos PDF ici</strong>
          <div className="small muted">ou cliquez pour les choisir · {maxMb} Mo maximum par fichier</div>
          <input ref={inputRef} type="file" accept="application/pdf,.pdf" multiple hidden
            onChange={(e) => { addFiles(e.target.files); e.target.value = '' }} />
        </div>

        {subjects.data?.length > 0 && (
          <Select label="Ranger dans la matière" placeholder="Aucune matière" value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            options={subjects.data.map((s) => ({ value: s.id, label: s.name }))} />
        )}

        {items.length > 0 && (
          <div className="divider-list">
            {items.map((item) => (
              <div key={item.id} className="upload-item">
                {item.status === 'done' ? <CheckCircle2 size={20} color="var(--mint)" aria-hidden />
                  : item.status === 'error' ? <AlertCircle size={20} color="var(--coral)" aria-hidden />
                    : <UploadCloud size={20} color="var(--ink-3)" aria-hidden />}
                <div className="grow">
                  <div className="row-between">
                    <span className="small truncate" style={{ fontWeight: 500 }}>{item.file.name}</span>
                    <span className="tiny muted nowrap">{formatBytes(item.file.size)}</span>
                  </div>
                  {item.status === 'uploading' && <ProgressBar value={item.progress} label="Envoi" />}
                  {item.status === 'error' && (
                    <span className="tiny" style={{ color: 'var(--coral)' }}>
                      {item.error} {item.quota && <Link to="/app/abonnement" onClick={close}>Voir l’offre Pro</Link>}
                    </span>
                  )}
                  {item.status === 'done' && (
                    <span className="tiny muted">Envoyé. Analyse en cours — <Link to={`/app/documents/${item.doc.id}`} onClick={close}>ouvrir le document</Link></span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
