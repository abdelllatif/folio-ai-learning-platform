const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
const shortFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' })
const dayFmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
const timeFmt = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' })
const rtf = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' })

const toDate = (v) => (v instanceof Date ? v : new Date(v))

export const formatDate = (v) => (v ? dateFmt.format(toDate(v)) : '—')
export const formatShortDate = (v) => (v ? shortFmt.format(toDate(v)) : '—')
export const formatDay = (v) => (v ? dayFmt.format(toDate(v)) : '—')
export const formatTime = (v) => (v ? timeFmt.format(toDate(v)) : '')

export function timeAgo(v) {
  if (!v) return '—'
  const diff = (toDate(v).getTime() - Date.now()) / 1000
  const units = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]]
  for (const [unit, secs] of units) {
    if (Math.abs(diff) >= secs) return rtf.format(Math.round(diff / secs), unit)
  }
  return "à l'instant"
}

export function formatBytes(bytes = 0) {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / 1024 ** 2).toFixed(1).replace('.', ',')} Mo`
}

export function formatDuration(seconds = 0) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m >= 60) return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`
  return m ? `${m} min ${s ? `${s} s` : ''}`.trim() : `${s} s`
}

export const formatMinutes = (m = 0) => (m >= 60 ? `${Math.floor(m / 60)} h ${m % 60 ? String(m % 60).padStart(2, '0') : ''}`.trim() : `${m} min`)

export const plural = (n, one, many = `${one}s`) => `${n} ${n > 1 ? many : one}`

export const pageRange = (start, end) => (end && end !== start ? `p. ${start}–${end}` : `p. ${start}`)

export function scoreTone(percent) {
  if (percent == null) return 'neutral'
  if (percent >= 80) return 'mint'
  if (percent >= 50) return 'amber'
  return 'coral'
}

export function greeting(date = new Date()) {
  const h = date.getHours()
  if (h < 5) return 'Bonsoir'
  if (h < 18) return 'Bonjour'
  return 'Bonsoir'
}

export const isoDate = (d = new Date()) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return z.toISOString().slice(0, 10)
}
