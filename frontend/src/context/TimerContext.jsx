import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { plannerApi } from '@/api'

/**
 * Pomodoro timer living above the router so it keeps running while the student
 * navigates. Finished focus blocks are logged as study sessions.
 */
const TimerContext = createContext(null)
export const PRESETS = { focus: 25, short: 5, long: 15 }

/** Two soft notes with the Web Audio API — no audio file to ship. */
function chime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    ;[660, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.value = freq
      osc.connect(gain).connect(ctx.destination)
      const t = ctx.currentTime + i * 0.25
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(0.2, t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.6)
      osc.start(t)
      osc.stop(t + 0.65)
    })
  } catch { /* audio not available */ }
}

export function TimerProvider({ children }) {
  const [mode, setMode] = useState('focus')
  const [lengths, setLengths] = useState(PRESETS)
  const [remaining, setRemaining] = useState(PRESETS.focus * 60)
  const [running, setRunning] = useState(false)
  const [documentId, setDocumentId] = useState(null)
  const [completed, setCompleted] = useState(0)
  const startedAt = useRef(null)
  const endsAt = useRef(null)

  const switchMode = useCallback((next, custom = lengths) => {
    setRunning(false)
    setMode(next)
    setRemaining(custom[next] * 60)
  }, [lengths])

  const finish = useCallback(() => {
    setRunning(false)
    if (mode === 'focus') {
      plannerApi.logSession({
        kind: 'pomodoro', minutes: lengths.focus, document: documentId,
        started_at: (startedAt.current || new Date()).toISOString(),
      }).catch(() => {})
      setCompleted((n) => n + 1)
      chime()
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Folio', { body: 'Session terminée. Prenez une pause.' })
      }
      switchMode((completed + 1) % 4 === 0 ? 'long' : 'short')
    } else {
      switchMode('focus')
    }
  }, [mode, lengths, documentId, completed, switchMode])

  useEffect(() => {
    if (!running) return undefined
    const tick = () => {
      const left = Math.max(0, Math.round((endsAt.current - Date.now()) / 1000))
      setRemaining(left)
      if (left === 0) finish()
    }
    const id = window.setInterval(tick, 500)
    return () => window.clearInterval(id)
  }, [running, finish])

  const value = useMemo(() => ({
    mode, remaining, running, lengths, completed, documentId,
    total: lengths[mode] * 60,
    start: () => {
      if (!startedAt.current || remaining === lengths[mode] * 60) startedAt.current = new Date()
      endsAt.current = Date.now() + remaining * 1000
      setRunning(true)
      if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission()
    },
    pause: () => setRunning(false),
    reset: () => { startedAt.current = null; switchMode(mode) },
    switchMode: (m) => { startedAt.current = null; switchMode(m) },
    setLengths: (next) => { setLengths(next); setRunning(false); setRemaining(next[mode] * 60) },
    setDocumentId,
  }), [mode, remaining, running, lengths, completed, documentId, switchMode])

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>
}

export const useTimer = () => useContext(TimerContext)

export const formatClock = (seconds) =>
  `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
