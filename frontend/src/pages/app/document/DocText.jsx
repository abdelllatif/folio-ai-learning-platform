import { useEffect, useState } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ExternalLink, NotebookPen, ScanText, Search } from 'lucide-react'
import { documentsApi } from '@/api'
import { NoteEditor } from '@/components/notes/NoteEditor'
import { Button, Spinner } from '@/components/ui'
import { useToast } from '@/context/ToastContext'

function highlight(text, query) {
  if (!query) return text
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
  return parts.map((p, i) => (i % 2 ? <mark key={i} className="hl">{p}</mark> : p))
}

/** Page-by-page reader of the extracted text, with search inside the document. */
export function DocText() {
  const { doc } = useOutletContext()
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const page = Math.min(doc.page_count, Math.max(1, Number(params.get('page')) || doc.last_page || 1))
  const [current, setCurrent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const [mark, setMark] = useState('')

  useEffect(() => {
    let alive = true
    setLoading(true)
    documentsApi.pages(doc.id, { number: page }).then((r) => alive && setCurrent(r.results[0] || null))
      .finally(() => alive && setLoading(false))
    documentsApi.opened(doc.id, page).catch(() => {})
    return () => { alive = false }
  }, [doc.id, page])

  const goTo = (n) => setParams((p) => { const x = new URLSearchParams(p); x.set('page', n); return x }, { replace: true })

  const find = async (e) => {
    e.preventDefault()
    if (query.trim().length < 2) return
    setSearching(true)
    try { setResults(await documentsApi.find(doc.id, query.trim())); setMark(query.trim()) } catch (err) { toast.error(err) } finally { setSearching(false) }
  }

  return (
    <div className="grid-main">
      <div>
        <div className="row-between" style={{ marginBottom: '1rem' }}>
          <div className="row">
            <Button variant="secondary" size="sm" iconOnly icon={ChevronLeft} aria-label="Page précédente" disabled={page <= 1} onClick={() => goTo(page - 1)} />
            <label className="small row" style={{ gap: 6 }}>
              Page
              <input className="input" type="number" min={1} max={doc.page_count} value={page} style={{ width: 70, height: 32 }}
                onChange={(e) => e.target.value && goTo(Math.min(doc.page_count, Math.max(1, Number(e.target.value))))} />
              sur {doc.page_count}
            </label>
            <Button variant="secondary" size="sm" iconOnly icon={ChevronRight} aria-label="Page suivante" disabled={page >= doc.page_count} onClick={() => goTo(page + 1)} />
          </div>
          <div className="row">
            <Button variant="ghost" size="sm" icon={NotebookPen} onClick={() => setNoteOpen(true)}>Note sur cette page</Button>
            <Button variant="ghost" size="sm" icon={ExternalLink} onClick={() => window.open(`${doc.file_url}#page=${page}`, '_blank', 'noopener')}>PDF</Button>
          </div>
        </div>
        <article className="panel" style={{ minHeight: 420 }}>
          {loading ? <Spinner /> : current?.text ? (
            <>
              {current.ocr_used && <span className="badge badge--amber" style={{ marginBottom: '0.75rem' }}><ScanText aria-hidden />Texte reconnu par OCR</span>}
              <div className="reading" style={{ whiteSpace: 'pre-wrap' }}>{highlight(current.text, mark)}</div>
            </>
          ) : <p className="muted">Cette page ne contient pas de texte (image ou page blanche).</p>}
        </article>
      </div>
      <aside className="panel">
        <form onSubmit={find} className="stack" style={{ '--stack': '0.6rem' }}>
          <label htmlFor="find-in-doc" className="field__label">Chercher dans le document</label>
          <div className="row">
            <div className="input-group grow"><Search aria-hidden />
              <input id="find-in-doc" className="input" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Un mot, une expression…" /></div>
            <Button type="submit" size="sm" loading={searching}>Chercher</Button>
          </div>
        </form>
        {results && (
          <div style={{ marginTop: '1rem' }}>
            <p className="tiny muted">{results.count} occurrence{results.count > 1 ? 's' : ''}</p>
            <div className="divider-list">
              {results.results.map((r, i) => (
                <button key={i} type="button" className="thread-link" onClick={() => goTo(r.page)}>
                  <strong className="tiny">Page {r.page}</strong>
                  <span className="small" style={{ display: 'block', color: 'var(--ink-2)' }}>…{highlight(r.snippet, results.query)}…</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>
      <NoteEditor open={noteOpen} onClose={() => setNoteOpen(false)} defaultDocument={doc.id} defaultPage={page} />
    </div>
  )
}
