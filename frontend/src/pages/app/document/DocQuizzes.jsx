import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { ListChecks, Sparkles } from 'lucide-react'
import { quizzesApi } from '@/api'
import { GenerateQuizModal } from '@/components/quiz/GenerateQuizModal'
import { AttemptTable, QuizTable } from '@/components/quiz/QuizTables'
import { Button, ConfirmDialog, EmptyState, SkeletonList } from '@/components/ui'
import { useToast } from '@/context/ToastContext'
import { useApi } from '@/hooks/useApi'

export function DocQuizzes() {
  const { doc } = useOutletContext()
  const toast = useToast()
  const quizzes = useApi(() => quizzesApi.list({ document: doc.id, page_size: 50 }), [doc.id])
  const attempts = useApi(() => quizzesApi.attempts({ quiz__document: doc.id, page_size: 10 }), [doc.id])
  const [open, setOpen] = useState(false)
  const [toDelete, setToDelete] = useState(null)

  const remove = async () => {
    await quizzesApi.remove(toDelete.id)
    setToDelete(null)
    quizzes.reload(); attempts.reload()
    toast.success('Quiz supprimé.')
  }

  return (
    <div className="stack" style={{ '--stack': '1.5rem' }}>
      <div className="row-between">
        <p className="muted small" style={{ margin: 0 }}>Des questions tirées de ce document, avec la page source de chaque réponse.</p>
        <Button icon={Sparkles} onClick={() => setOpen(true)}>Nouveau quiz</Button>
      </div>
      {quizzes.loading && <SkeletonList rows={2} />}
      {quizzes.data?.results?.length === 0 && (
        <div className="panel">
          <EmptyState icon={ListChecks} title="Testez-vous sur ce cours" action={<Button icon={Sparkles} onClick={() => setOpen(true)}>Générer un quiz</Button>}>
            Choisissez le nombre de questions, la difficulté, et éventuellement un thème précis.
          </EmptyState>
        </div>
      )}
      {quizzes.data?.results?.length > 0 && <QuizTable quizzes={quizzes.data.results} showDocument={false} onDelete={setToDelete} />}
      {attempts.data?.results?.length > 0 && (
        <section>
          <h2 style={{ fontSize: 'var(--fs-md)' }}>Dernières tentatives</h2>
          <AttemptTable attempts={attempts.data.results} />
        </section>
      )}
      <GenerateQuizModal open={open} onClose={() => setOpen(false)} defaultDocument={doc.id} />
      <ConfirmDialog open={Boolean(toDelete)} onClose={() => setToDelete(null)} onConfirm={remove}
        title="Supprimer ce quiz ?" message="Le quiz et l’historique de ses tentatives seront supprimés." />
    </div>
  )
}
