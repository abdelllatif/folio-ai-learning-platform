import { useEffect, useRef, useState } from 'react'

export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(id)
  }, [value, delay])
  return debounced
}

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · Folio` : 'Folio — vos cours, enfin clairs'
  }, [title])
}

/** Run ``callback`` every ``delay`` ms while ``active``. */
export function useInterval(callback, delay, active = true) {
  const saved = useRef(callback)
  saved.current = callback
  useEffect(() => {
    if (!active || delay == null) return undefined
    const id = window.setInterval(() => saved.current(), delay)
    return () => window.clearInterval(id)
  }, [delay, active])
}

export function useClickOutside(ref, handler, active = true) {
  useEffect(() => {
    if (!active) return undefined
    const listener = (e) => { if (ref.current && !ref.current.contains(e.target)) handler(e) }
    const onKey = (e) => { if (e.key === 'Escape') handler(e) }
    document.addEventListener('mousedown', listener)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('keydown', onKey)
    }
  }, [ref, handler, active])
}
