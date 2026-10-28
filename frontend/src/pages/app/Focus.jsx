import { Pause, Play, RotateCcw, Settings2 } from 'lucide-react'
import { useState } from 'react'
import { documentsApi, plannerApi } from '@/api'
import { Button, Input, Modal, ProgressRing, Segmented, Select } from '@/components/ui'
import { formatClock, useTimer } from '@/context/TimerContext'
import { useApi } from '@/hooks/useApi'
import { usePageTitle } from '@/hooks/misc'
import { formatTime, isoDate } from '@/utils/format'

const MODES = [{ value: 'focus', label: 'Concentration' }, { value: 'short', label: 'Pause courte' }, { value: 'long', label: 'Pause longue' }]

export function Focus() {
  const timer = useTimer()
  usePageTitle(timer.running ? `${formatClock(timer.remaining)} — Concentration` : 'Concentration')
  const docs = useApi(() => documentsApi.list({ status: 'ready', page_size: 100 }), [])
  const sessions = useApi(() => plannerApi.sessions({ page_size: 20 }), [timer.completed])
  const [settings, setSettings] = useState(false)
  const [lengths, setLengths] = useState(timer.lengths)
  const todays = (sessions.data?.results || []).filter((s) => s.started_at.slice(0, 10) === isoDate())
  const minutesToday = todays.reduce((n, s) => n + s.minutes, 0)

  return (
    <div className="focus">
      <Segmented options={MODES} value={timer.mode} onChange={timer.switchMode} label="Mode du minuteur" />
      <div style={{ display: 'grid', placeItems: 'center', marginTop: '2rem' }}>
        <ProgressRing value={100 - (100 * timer.remaining) / timer.total} size={280} stroke={10}
          tone={timer.mode === 'focus' ? 'blue' : 'mint'} label="Temps écoulé">
          <span className="focus__clock" style={{ margin: 0, fontSize: '4.2rem' }} aria-live="off">{formatClock(timer.remaining)}</span>
        </ProgressRing>
      </div>
      <div className="row" style={{ justifyContent: 'center', marginTop: '2rem' }}>
        {timer.running
          ? <Button size="lg" variant="secondary" icon={Pause} onClick={timer.pause}>Pause</Button>
          : <Button size="lg" icon={Play} onClick={timer.start}>{timer.remaining === timer.total ? 'Démarrer' : 'Reprendre'}</Button>}
        <Button size="lg" variant="ghost" iconOnly icon={RotateCcw} onClick={timer.reset} aria-label="Réinitialiser" />
        <Button size="lg" variant="ghost" iconOnly icon={Settings2} onClick={() => { setLengths(timer.lengths); setSettings(true) }} aria-label="Durées" />
      </div>

      <div style={{ maxWidth: 360, margin: '2rem auto 0', textAlign: 'left' }}>
        <Select label="Je travaille sur" placeholder="Aucun document en particulier" value={timer.documentId || ''}
          onChange={(e) => timer.setDocumentId(e.target.value ? Number(e.target.value) : null)}
          options={(docs.data?.results || []).map((d) => ({ value: d.id, label: d.title }))} />
      </div>

      <div className="panel" style={{ marginTop: '2rem', textAlign: 'left' }}>
        <div className="panel__head"><h2>Aujourd’hui</h2><span className="small muted">{minutesToday} min · {todays.length} session{todays.length > 1 ? 's' : ''}</span></div>
        {todays.length === 0 ? <p className="small muted" style={{ margin: 0 }}>Chaque session de concentration terminée est comptée dans votre objectif du jour.</p> : (
          <div className="divider-list">
            {todays.map((s) => (
              <div key={s.id} className="row-between small" style={{ padding: '0.5rem 0' }}>
                <span>{formatTime(s.started_at)} · {s.kind === 'pomodoro' ? 'Concentration' : s.kind === 'flashcards' ? 'Fiches' : 'Étude'}</span>
                <span className="muted">{s.minutes} min</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="tiny muted" style={{ marginTop: '1rem' }}>Le minuteur continue quand vous changez de page ; il reste visible en haut de l’écran.</p>

      <Modal open={settings} onClose={() => setSettings(false)} title="Durées"
        footer={<><Button variant="secondary" onClick={() => setSettings(false)}>Annuler</Button>
          <Button onClick={() => { timer.setLengths({ focus: Number(lengths.focus), short: Number(lengths.short), long: Number(lengths.long) }); setSettings(false) }}>Enregistrer</Button></>}>
        <div className="form-grid">
          <Input label="Concentration (min)" type="number" min={5} max={120} value={lengths.focus} onChange={(e) => setLengths({ ...lengths, focus: e.target.value })} />
          <Input label="Pause courte (min)" type="number" min={1} max={30} value={lengths.short} onChange={(e) => setLengths({ ...lengths, short: e.target.value })} />
          <Input label="Pause longue (min)" type="number" min={5} max={60} value={lengths.long} onChange={(e) => setLengths({ ...lengths, long: e.target.value })} />
        </div>
      </Modal>
    </div>
  )
}
