import { useState } from 'react'
import { supportApi } from '@/api'
import { Button } from '@/components/ui'

export function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState({ status: 'idle', message: '' })

  const submit = async (e) => {
    e.preventDefault()
    setState({ status: 'loading', message: '' })
    try {
      await supportApi.newsletter(email)
      setState({ status: 'done', message: 'Inscrit. Un conseil de révision par mois, pas plus.' })
      setEmail('')
    } catch (err) {
      setState({ status: 'error', message: err.message })
    }
  }

  return (
    <form onSubmit={submit} style={{ marginTop: '1rem' }}>
      <label htmlFor="newsletter" className="small" style={{ fontWeight: 500 }}>Conseils de révision, une fois par mois</label>
      <div className="row" style={{ marginTop: '0.4rem', maxWidth: 360 }}>
        <input id="newsletter" type="email" required className="input" placeholder="vous@exemple.ma"
          value={email} onChange={(e) => setEmail(e.target.value)} style={{ height: 36 }} />
        <Button type="submit" size="sm" loading={state.status === 'loading'}>S’inscrire</Button>
      </div>
      {state.message && (
        <p className="tiny" style={{ marginTop: '0.4rem', color: state.status === 'error' ? 'var(--coral)' : 'var(--mint)' }}>
          {state.message}
        </p>
      )}
    </form>
  )
}
