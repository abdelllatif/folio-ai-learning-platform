import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { authApi } from '@/api'
import { fieldErrors } from '@/api/client'
import { Alert, Button, Input } from '@/components/ui'
import { usePageTitle } from '@/hooks/misc'

export function ForgotPassword() {
  usePageTitle('Mot de passe oublié')
  const [email, setEmail] = useState('')
  const [state, setState] = useState({ status: 'idle' })

  const submit = async (e) => {
    e.preventDefault()
    setState({ status: 'loading' })
    try {
      const res = await authApi.requestReset(email.trim())
      setState({ status: 'sent', message: res.detail })
    } catch (err) {
      setState({ status: 'error', message: err.message })
    }
  }

  return (
    <>
      <h1>Mot de passe oublié</h1>
      <p className="muted">Indiquez votre e-mail : nous vous envoyons un lien pour en choisir un nouveau.</p>
      {state.status === 'sent' ? (
        <Alert kind="success" title="Vérifiez votre boîte mail">{state.message} Pensez aux courriers indésirables.</Alert>
      ) : (
        <form onSubmit={submit} className="stack" style={{ marginTop: '1.5rem' }}>
          {state.status === 'error' && <Alert kind="error">{state.message}</Alert>}
          <Input label="E-mail" type="email" icon={Mail} required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" block loading={state.status === 'loading'}>Envoyer le lien</Button>
        </form>
      )}
      <p className="small" style={{ marginTop: '1.5rem' }}><Link to="/connexion">Retour à la connexion</Link></p>
    </>
  )
}

export function ResetPassword() {
  usePageTitle('Nouveau mot de passe')
  const [params] = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [state, setState] = useState({ status: 'idle', errors: {} })
  const uid = params.get('uid')
  const token = params.get('token')

  const submit = async (e) => {
    e.preventDefault()
    if (password !== confirm) {
      setState({ status: 'idle', errors: { confirm: 'Les deux mots de passe ne correspondent pas.' } })
      return
    }
    setState({ status: 'loading', errors: {} })
    try {
      const res = await authApi.confirmReset({ uid, token, password })
      setState({ status: 'done', message: res.detail, errors: {} })
    } catch (err) {
      const fe = fieldErrors(err)
      setState({ status: 'error', message: fe.non_field_errors || err.message, errors: fe })
    }
  }

  if (!uid || !token) {
    return <Alert kind="error" title="Lien incomplet">Ouvrez le lien reçu par e-mail en entier, ou <Link to="/mot-de-passe-oublie">refaites une demande</Link>.</Alert>
  }

  return (
    <>
      <h1>Choisir un nouveau mot de passe</h1>
      {state.status === 'done' ? (
        <Alert kind="success" title="C’est fait" action={<Button to="/connexion" size="sm">Se connecter</Button>}>{state.message}</Alert>
      ) : (
        <form onSubmit={submit} className="stack" style={{ marginTop: '1.5rem' }}>
          {state.status === 'error' && <Alert kind="error">{state.message}</Alert>}
          <Input label="Nouveau mot de passe" type="password" required autoComplete="new-password" value={password}
            onChange={(e) => setPassword(e.target.value)} error={state.errors.password} hint="8 caractères minimum." />
          <Input label="Confirmer" type="password" required autoComplete="new-password" value={confirm}
            onChange={(e) => setConfirm(e.target.value)} error={state.errors.confirm} />
          <Button type="submit" block loading={state.status === 'loading'}>Enregistrer le mot de passe</Button>
        </form>
      )}
    </>
  )
}
