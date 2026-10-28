import { Outlet } from 'react-router-dom'
import { Logo } from '@/components/ui'

export function AuthLayout() {
  return (
    <div className="auth">
      <div className="auth__form">
        <Logo />
        <div className="auth__form-inner"><Outlet /></div>
      </div>
      <aside className="auth__aside" aria-hidden>
        <blockquote>
          Un cours de 80 pages, <mark className="hl">résumé, expliqué et transformé en quiz</mark> avant la fin de votre café.
        </blockquote>
        <p style={{ opacity: 0.8, maxWidth: '40ch', margin: 0 }}>
          Chaque réponse de l’assistant cite la page du document d’où elle vient. Vous pouvez toujours vérifier.
        </p>
      </aside>
    </div>
  )
}
