import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Lock, Mail } from 'lucide-react'
import { Alert, Button, Input } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { usePageTitle } from '@/hooks/misc'

export function Login() {
  usePageTitle('Connexion')
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await login(form.email.trim(), form.password)
      navigate(location.state?.from?.pathname || '/app', { replace: true })
    } catch (err) {
      setError(err.status === 401 ? 'E-mail ou mot de passe incorrect.' : err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h1>Bon retour</h1>
      <p className="muted">Connectez-vous pour retrouver vos cours.</p>
      <form onSubmit={submit} className="stack" style={{ marginTop: '1.5rem' }}>
        {error && <Alert kind="error">{error}</Alert>}
        <Input label="E-mail" type="email" icon={Mail} required autoComplete="email" autoFocus
          value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input label="Mot de passe" type="password" icon={Lock} required autoComplete="current-password"
          value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <div className="row-between small">
          <span />
          <Link to="/mot-de-passe-oublie">Mot de passe oublié ?</Link>
        </div>
        <Button type="submit" block size="lg" loading={loading}>Se connecter</Button>
      </form>
      <p className="small muted" style={{ marginTop: '1.5rem' }}>
        Pas encore de compte ? <Link to="/inscription">Créer un compte gratuit</Link>
      </p>
    </>
  )
}
