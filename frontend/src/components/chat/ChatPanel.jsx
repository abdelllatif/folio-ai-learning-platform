import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Copy, Download, MessageSquarePlus, Pencil, Pin, PinOff, Send, ThumbsDown, ThumbsUp, Trash2,
} from 'lucide-react'
import { chatApi, downloadExport } from '@/api'
import { SaveToNotes } from '@/components/notes/SaveToNotes'
import { Button, ConfirmDialog, EmptyState, Input, Markdown, Menu, Modal, Spinner } from '@/components/ui'
import { useToast } from '@/context/ToastContext'
import { useApi } from '@/hooks/useApi'
import { pageRange, timeAgo } from '@/utils/format'

function Sources({ citations, active }) {
  if (!citations?.length) return null
  return (
    <div className="stack" style={{ '--stack': '0.4rem', marginTop: '0.7rem' }}>
      {citations.map((c) => (
        <div key={c.marker} id={`src-${c.chunk}-${c.marker}`} className={`source-card ${active === c.marker ? 'flash' : ''}`}>
          <div className="row" style={{ marginBottom: 2 }}>
            <span className="cite" aria-hidden>{c.marker}</span>
            <strong className="tiny">{pageRange(c.page_start, c.page_end)}</strong>
          </div>
          <span className="muted" style={{ fontFamily: 'var(--font-read)' }}>{c.excerpt}</span>
        </div>
      ))}
    </div>
  )
}

function AssistantMessage({ message, documentId, onFollowUp }) {
  const toast = useToast()
  const [showSources, setShowSources] = useState(false)
  const [active, setActive] = useState(null)
  const [feedback, setFeedback] = useState(message.feedback)

  const cite = (n) => { setShowSources(true); setActive(n); window.setTimeout(() => setActive(null), 1300) }
  const rate = async (value) => {
    const next = feedback === value ? 0 : value
    setFeedback(next || null)
    chatApi.feedback(message.id, next).catch(() => {})
  }

  if (!message.grounded) {
    return (
      <div className="msg msg--assistant">
        <div className="msg--refused small">{message.content}</div>
        <p className="tiny muted" style={{ marginTop: '0.4rem' }}>Reformulez avec les mots du cours, ou vérifiez que la question porte sur ce document.</p>
      </div>
    )
  }
  return (
    <div className="msg msg--assistant">
      <Markdown onCite={cite}>{message.content}</Markdown>
      <div className="msg__meta">
        {message.citations.length > 0 && (
          <button type="button" className="badge badge--yellow" style={{ border: 0, cursor: 'pointer' }} onClick={() => setShowSources((s) => !s)}>
            {showSources ? 'Masquer les sources' : `${message.citations.length} source${message.citations.length > 1 ? 's' : ''} · ${message.citations.map((c) => pageRange(c.page_start, c.page_end)).join(', ')}`}
          </button>
        )}
        {message.generated_by === 'extractive' && <span className="badge badge--amber">Extraits du document</span>}
        <span className="grow" />
        <Button variant="ghost" size="sm" iconOnly icon={Copy} aria-label="Copier la réponse"
          onClick={async () => { await navigator.clipboard.writeText(message.content); toast.success('Réponse copiée.') }} />
        <Button variant="ghost" size="sm" iconOnly icon={ThumbsUp} aria-label="Réponse utile" aria-pressed={feedback === 1}
          style={feedback === 1 ? { color: 'var(--mint)' } : undefined} onClick={() => rate(1)} />
        <Button variant="ghost" size="sm" iconOnly icon={ThumbsDown} aria-label="Réponse peu utile" aria-pressed={feedback === -1}
          style={feedback === -1 ? { color: 'var(--coral)' } : undefined} onClick={() => rate(-1)} />
        <SaveToNotes documentId={documentId} quote={message.content} title="Réponse de l’assistant"
          page={message.citations[0]?.page_start} label="Garder" />
      </div>
      {showSources && <Sources citations={message.citations} active={active} />}
      {message.follow_ups?.length > 0 && onFollowUp && (
        <div className="row wrap" style={{ marginTop: '0.7rem' }}>
          {message.follow_ups.map((q) => <button key={q} type="button" className="chip" onClick={() => onFollowUp(q)}>{q}</button>)}
        </div>
      )}
    </div>
  )
}

/**
 * Conversations of one document. The selected thread is kept in ``?c=`` so it survives refresh.
 */
export function ChatPanel({ document: doc, showThreads = true }) {
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const selectedId = params.get('c') ? Number(params.get('c')) : null
  const threads = useApi(() => chatApi.list({ document: doc.id, page_size: 100 }), [doc.id])
  const [messages, setMessages] = useState([])
  const [loadingThread, setLoadingThread] = useState(false)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [renaming, setRenaming] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const bottom = useRef(null)
  const textarea = useRef(null)

  const select = (id) => setParams((p) => { const n = new URLSearchParams(p); id ? n.set('c', id) : n.delete('c'); return n }, { replace: true })

  useEffect(() => {
    if (!selectedId) { setMessages([]); return }
    let alive = true
    setLoadingThread(true)
    chatApi.get(selectedId).then((c) => alive && setMessages(c.messages)).catch(() => alive && select(null))
      .finally(() => alive && setLoadingThread(false))
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [messages, sending])

  const send = async (text = draft) => {
    const content = text.trim()
    if (!content || sending) return
    setSending(true)
    setDraft('')
    let convId = selectedId
    const temp = { id: `tmp-${Date.now()}`, role: 'user', content }
    setMessages((m) => [...m, temp])
    try {
      if (!convId) {
        const conv = await chatApi.create(doc.id)
        convId = conv.id
        select(conv.id)
      }
      const res = await chatApi.ask(convId, content)
      setMessages((m) => [...m.filter((x) => x.id !== temp.id), res.question, res.answer])
      threads.reload()
    } catch (err) {
      setMessages((m) => m.filter((x) => x.id !== temp.id))
      setDraft(content)
      toast.error(err)
    } finally {
      setSending(false)
      textarea.current?.focus()
    }
  }

  const rename = async () => {
    await chatApi.rename(renaming.id, renaming.title)
    setRenaming(null); threads.reload()
  }
  const remove = async () => {
    await chatApi.remove(deleting.id)
    if (deleting.id === selectedId) select(null)
    setDeleting(null); threads.reload()
    toast.success('Conversation supprimée.')
  }

  const starters = (doc.faq || []).slice(0, 3).map((f) => f.question)
  if (!starters.length && doc.keywords?.length) starters.push(`Explique-moi « ${doc.keywords[0]} »`, 'Quelles sont les notions principales de ce cours ?')
  const current = threads.data?.results?.find((t) => t.id === selectedId)

  return (
    <div className={`chat ${showThreads ? '' : 'chat--solo'}`}>
      {showThreads && (
        <nav className="chat__threads" aria-label="Conversations">
          <Button variant="secondary" size="sm" block icon={MessageSquarePlus} onClick={() => select(null)} style={{ marginBottom: '0.5rem' }}>Nouvelle conversation</Button>
          {threads.data?.results?.map((t) => (
            <div key={t.id} className="row" style={{ gap: 2 }}>
              <button type="button" className={`thread-link grow ${t.id === selectedId ? 'active' : ''}`} onClick={() => select(t.id)}>
                <span className="truncate" style={{ display: 'block' }}>{t.is_pinned && '📌 '}{t.title}</span>
                <small>{timeAgo(t.updated_at)} · {t.message_count} messages</small>
              </button>
              <Menu items={[
                { label: 'Renommer', icon: Pencil, onClick: () => setRenaming({ id: t.id, title: t.title }) },
                { label: t.is_pinned ? 'Désépingler' : 'Épingler', icon: t.is_pinned ? PinOff : Pin, onClick: async () => { await chatApi.pin(t.id, !t.is_pinned); threads.reload() } },
                { label: 'Exporter (Markdown)', icon: Download, onClick: () => downloadExport(chatApi.exportUrl(t.id), `conversation-${t.id}.md`) },
                { label: 'Supprimer', icon: Trash2, danger: true, onClick: () => setDeleting(t) },
              ]} />
            </div>
          ))}
          {threads.data?.results?.length === 0 && <p className="tiny muted" style={{ padding: '0.5rem' }}>Vos conversations sur ce document apparaîtront ici.</p>}
        </nav>
      )}

      <section className="chat__panel" aria-label={current?.title || 'Nouvelle conversation'}>
        <div className="chat__messages" aria-live="polite">
          {loadingThread && <div style={{ margin: 'auto' }}><Spinner large /></div>}
          {!loadingThread && messages.length === 0 && (
            <div style={{ margin: 'auto', maxWidth: 520 }}>
              <EmptyState icon={MessageSquarePlus} title="Posez une question sur ce cours">
                Les réponses viennent uniquement de « {doc.title} » et citent leurs pages.
              </EmptyState>
              <div className="stack" style={{ '--stack': '0.5rem' }}>
                {starters.map((s) => <button key={s} type="button" className="chip" style={{ width: '100%' }} onClick={() => send(s)}>{s}</button>)}
              </div>
            </div>
          )}
          {messages.map((m) => (m.role === 'user'
            ? <div key={m.id} className="msg msg--user">{m.content}</div>
            : <AssistantMessage key={m.id} message={m} documentId={doc.id} onFollowUp={send} />))}
          {sending && <div className="msg msg--assistant"><span className="typing" aria-label="Folio rédige une réponse"><span /><span /><span /></span></div>}
          <div ref={bottom} />
        </div>
        <form className="chat__composer" onSubmit={(e) => { e.preventDefault(); send() }}>
          <textarea ref={textarea} className="textarea" rows={1} placeholder="Votre question sur le cours…" value={draft}
            aria-label="Votre question" maxLength={2000}
            onChange={(e) => { setDraft(e.target.value); e.target.style.height = 'auto'; e.target.style.height = `${e.target.scrollHeight}px` }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} />
          <Button type="submit" iconOnly icon={Send} aria-label="Envoyer" loading={sending} disabled={!draft.trim()} />
        </form>
      </section>

      <Modal open={Boolean(renaming)} onClose={() => setRenaming(null)} title="Renommer la conversation"
        footer={<><Button variant="secondary" onClick={() => setRenaming(null)}>Annuler</Button><Button onClick={rename}>Enregistrer</Button></>}>
        <Input label="Titre" value={renaming?.title || ''} onChange={(e) => setRenaming((r) => ({ ...r, title: e.target.value }))} />
      </Modal>
      <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} onConfirm={remove}
        title="Supprimer la conversation ?" message={`« ${deleting?.title} » et ses messages seront supprimés.`} />
    </div>
  )
}
