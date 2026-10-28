import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { History, ListChecks, Sparkles } from 'lucide-react'
import { documentsApi, quizzesApi } from '@/api'
import { ScoreTrend } from '@/components/charts/ScoreTrend'
import { GenerateQuizModal } from '@/components/quiz/GenerateQuizModal'
import { AttemptTable, QuizTable } from '@/components/quiz/QuizTables'
import { Button, ConfirmDialog, EmptyState, ErrorState, Select, SkeletonList, Tabs } from '@/components/ui'
import { useToast } from '@/context/ToastContext'
import { useApi } from '@/hooks/useApi'
import { usePageTitle } from '@/hooks/misc'

export function Quizzes() {
  usePageTitle('Quiz')
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const tab = params.get('onglet') === 'historique' ? 'history' : 'quizzes'
  const [docFilter, setDocFilter] = useState('')
  const [open, setOpen] = useState(false)
  const [toDelete, setToDelete] = useState(null)
  const docs = useApi(() => documentsApi.list({ status: 'ready', page_size: 100 }), [])
  const quizzes = useApi(() => quizzesApi.list({ document: docFilter || undefined, page_size: 100 }), [docFilter])
  const attempts = useApi(() => quizzesApi.attempts({ quiz__document: docFilter || undefined, page_size: 100 }), [docFilter])

  const remove = async () => {
    await quizzesApi.remove(toDelete.id)
    setToDelete(null); quizzes.reload(); attempts.reload()
    toast.success('Quiz supprimé.')
  }
  const trend = (attempts.data?.results || []).slice(0, 20).reverse()
    .map((a) => ({ date: a.completed_at, percent: a.percent, quiz: a.quiz_title }))
  const docOptions = (docs.data?.results || []).map((d) => ({ value: d.id, label: d.title }))

  return (
    <>
      <div className="page-head">
        <div><h1>Quiz</h1><p>Entraînez-vous et suivez vos scores dans le temps.</p></div>
        <div className="page-head__actions">
          <Select aria-label="Filtrer par document" placeholder="Tous les documents" value={docFilter}
            onChange={(e) => setDocFilter(e.target.value)} options={docOptions} />
          <Button icon={Sparkles} onClick={() => setOpen(true)} disabled={!docOptions.length}>Nouveau quiz</Button>
        </div>
      </div>

      <Tabs value={tab} onChange={(v) => setParams(v === 'history' ? { onglet: 'historique' } : {})} label="Quiz"
        tabs={[{ value: 'quizzes', label: 'Mes quiz', icon: ListChecks }, { value: 'history', label: 'Historique', icon: History }]} />
      <div style={{ paddingTop: '1.25rem' }}>
        {tab === 'quizzes' && (
          quizzes.error ? <ErrorState error={quizzes.error} onRetry={quizzes.reload} />
            : quizzes.loading ? <SkeletonList />
              : quizzes.data.results.length === 0 ? (
                <div className="panel">
                  <EmptyState icon={ListChecks} title="Aucun quiz pour l’instant"
                    action={docOptions.length ? <Button icon={Sparkles} onClick={() => setOpen(true)}>Générer un quiz</Button> : <Button to="/app/bibliotheque">Déposer un document</Button>}>
                    {docOptions.length ? 'Générez un quiz à partir d’un de vos documents.' : 'Il faut d’abord un document analysé.'}
                  </EmptyState>
                </div>
              ) : <QuizTable quizzes={quizzes.data.results} onDelete={setToDelete} />
        )}
        {tab === 'history' && (
          attempts.loading ? <SkeletonList /> : attempts.data?.results?.length ? (
            <div className="stack" style={{ '--stack': '1.25rem' }}>
              {trend.length > 1 && <div className="panel"><div className="panel__head"><h2>Évolution</h2><span className="tiny muted">Ligne verte : 80 %</span></div><ScoreTrend data={trend} /></div>}
              <AttemptTable attempts={attempts.data.results} />
            </div>
          ) : <div className="panel"><EmptyState icon={History} title="Aucune tentative">Vos résultats apparaîtront ici après votre premier quiz.</EmptyState></div>
        )}
      </div>
      <GenerateQuizModal open={open} onClose={() => setOpen(false)} documents={docs.data?.results || []} />
      <ConfirmDialog open={Boolean(toDelete)} onClose={() => setToDelete(null)} onConfirm={remove}
        title="Supprimer ce quiz ?" message="Le quiz et l’historique de ses tentatives seront supprimés." />
    </>
  )
}
