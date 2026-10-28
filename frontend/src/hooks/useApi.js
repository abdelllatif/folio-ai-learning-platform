import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Load data on mount / when deps change.
 * Returns { data, error, loading, reload, setData }.
 */
export function useApi(fetcher, deps = [], { enabled = true } = {}) {
  const [state, setState] = useState({ data: null, error: null, loading: enabled })
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher
  const requestId = useRef(0)

  const load = useCallback(async () => {
    const id = ++requestId.current
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const data = await fetcherRef.current()
      if (id === requestId.current) setState({ data, error: null, loading: false })
      return data
    } catch (error) {
      if (id === requestId.current) setState((s) => ({ ...s, error, loading: false }))
      return null
    }
  }, [])

  useEffect(() => {
    if (enabled) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps])

  const setData = useCallback((updater) =>
    setState((s) => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater })), [])

  return { ...state, reload: load, setData }
}

/** Wrap an async action with a pending flag. */
export function useAction(action) {
  const [pending, setPending] = useState(false)
  const run = useCallback(async (...args) => {
    setPending(true)
    try { return await action(...args) } finally { setPending(false) }
  }, [action])
  return [run, pending]
}
