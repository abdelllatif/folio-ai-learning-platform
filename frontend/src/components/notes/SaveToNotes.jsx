import { useState } from 'react'
import { BookmarkPlus, Check } from 'lucide-react'
import { notesApi } from '@/api'
import { Button } from '@/components/ui'
import { useToast } from '@/context/ToastContext'

/** One-click « keep this » for any generated passage. */
export function SaveToNotes({ documentId, quote, title, page, label = 'Garder dans mes notes', size = 'sm' }) {
  const toast = useToast()
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await notesApi.create({ document: documentId, quote: quote.slice(0, 5000), title, page, color: 'yellow' })
      setSaved(true)
      toast.success('Ajouté à vos notes.')
    } catch (err) {
      toast.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Button variant="ghost" size={size} icon={saved ? Check : BookmarkPlus} onClick={save} loading={saving} disabled={saved}>
      {saved ? 'Dans vos notes' : label}
    </Button>
  )
}
