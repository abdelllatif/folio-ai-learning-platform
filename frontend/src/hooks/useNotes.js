import { useState } from 'react'
import { notesApi } from '@/api'
import { useToast } from '@/context/ToastContext'
import { useApi } from './useApi'

/** Notes list + the edit / delete / pin actions shared by the Notes page and the document tab. */
export function useNotes(params, deps) {
  const toast = useToast()
  const notes = useApi(() => notesApi.list({ page_size: 100, ...params }), deps)
  const [editing, setEditing] = useState(null) // null | {} (new) | note

  const remove = async (n) => {
    await notesApi.remove(n.id)
    notes.setData((d) => ({ ...d, results: d.results.filter((x) => x.id !== n.id), count: d.count - 1 }))
    toast.success('Note supprimée.')
  }
  const togglePin = async (n) => { await notesApi.update(n.id, { is_pinned: !n.is_pinned }); notes.reload() }

  return { notes, editing, setEditing, remove, togglePin }
}
