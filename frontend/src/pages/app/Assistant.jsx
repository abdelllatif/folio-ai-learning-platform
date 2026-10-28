import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MessagesSquare } from 'lucide-react'
import { chatApi, documentsApi } from '@/api'
import { ChatPanel } from '@/components/chat/ChatPanel'
import { Button, EmptyState, ErrorState, Select, SkeletonList } from '@/components/ui'
import { useApi } from '@/hooks/useApi'
import { usePageTitle } from '@/hooks/misc'
import { timeAgo } from '@/utils/format'

/** All conversations, grouped by document; pick a document to chat with it. */
export function Assistant() {
  usePageTitle('Assistant')
  const [params, setParams] = useSearchParams()
  const docs = useApi(() => documentsApi.list({ status: 'ready', page_size: 100, ordering: '-last_opened_at' }), [])
  const recent = useApi(() => chatApi.list({ page_size: 8 }), [])
  const [docId, setDocId] = useState(params.get('document') || '')
  const selected = docs.data?.results?.find((d) => String(d.id) === String(docId))

  useEffect(() => {
    if (!docId && docs.data?.results?.length) setDocId(String(docs.data.results[0].id))
  }, [docs.data, docId])

  const choose = (id) => {
    setDocId(id)
    setParams(id ? { document: id } : {}, { replace: true })
  }

  if (docs.error) return <ErrorState error={docs.error} onRetry={docs.reload} />
  if (docs.loading) return <SkeletonList />

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Assistant</h1>
          <p>Posez vos questions à un document : chaque réponse cite ses pages.</p>
        </div>
        {docs.data.results.length > 0 && (
          <Select aria-label="Document" value={docId} onChange={(e) => choose(e.target.value)} style={{ minWidth: 280 }}
            options={docs.data.results.map((d) => ({ value: String(d.id), label: d.title }))} />
        )}
      </div>

      {docs.data.results.length === 0 ? (
        <div className="panel">
          <EmptyState icon={MessagesSquare} title="Aucun document prêt"
            action={<Button to="/app/bibliotheque">Aller à la bibliothèque</Button>}>
            L’assistant répond à partir de vos documents. Déposez un cours et attendez la fin de l’analyse.
          </EmptyState>
        </div>
      ) : (
        <>
          {recent.data?.results?.length > 0 && (
            <div className="row wrap" style={{ marginBottom: '1rem' }}>
              <span className="small muted">Récentes :</span>
              {recent.data.results.slice(0, 5).map((c) => (
                <button key={c.id} type="button" className="chip"
                  onClick={() => { setDocId(String(c.document)); setParams({ document: c.document, c: c.id }, { replace: true }) }}>
                  <span className="truncate" style={{ maxWidth: 220 }}>{c.title}</span><span className="tiny muted">{timeAgo(c.updated_at)}</span>
                </button>
              ))}
            </div>
          )}
          {selected && <ChatPanel key={selected.id} document={selected} />}
        </>
      )}
    </>
  )
}
