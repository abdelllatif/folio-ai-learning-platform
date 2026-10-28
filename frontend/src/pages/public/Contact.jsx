import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Clock, Mail, School } from 'lucide-react'
import { supportApi } from '@/api'
import { fieldErrors } from '@/api/client'
import { Alert, Button, Input, Select, Textarea } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { usePageTitle } from '@/hooks/misc'

const TOPICS = [
  { value: 'question', label: 'Une question' },
  { value: 'bug', label: 'Signaler un problème' },
  { value: 'feature', label: 'Proposer une amélioration' },
  { value: 'school', label: 'Offre établissement' },
  { value: 'billing', label: 'Facturation' },
]

export function ContactForm() {
  const { user } = useAuth()
  const [params] = useSearchParams()
  const [form, setForm] = useState({
    name: user?.full_name || '', email: user?.email || '', organization: '', message: '',
    topic: TOPICS.some((t) => t.value === params.get('sujet')) ? params.get('sujet') : 'question',
  })
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState({ state: 'idle' })
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setStatus({ state: 'loading' })
    setErrors({})
    try {
      const res = await supportApi.contact(form)
      setStatus({ state: 'done', message: res.detail })
      setForm((f) => ({ ...f, message: '' }))
    } catch (err) {
      setErrors(fieldErrors(err))
      setStatus({ state: 'error', message: err.message })
    }
  }

  if (status.state === 'done') {
    return <Alert kind="success" title="Message envoyé">{status.message}</Alert>
  }

  return (
    <form onSubmit={submit} className="stack" noValidate>
      {status.state === 'error' && !Object.keys(errors).length && <Alert kind="error">{status.message}</Alert>}
      <div className="form-grid">
        <Input label="Nom" required value={form.name} onChange={set('name')} error={errors.name} autoComplete="name" />
        <Input label="E-mail" type="email" required value={form.email} onChange={set('email')} error={errors.email} autoComplete="email" />
        <Select label="Sujet" options={TOPICS} value={form.topic} onChange={set('topic')} />
        {form.topic === 'school' && <Input label="Établissement" value={form.organization} onChange={set('organization')} placeholder="Nom et ville" />}
        <Textarea className="span-2" label="Message" required rows={6} value={form.message} onChange={set('message')}
          error={errors.message} hint={form.topic === 'bug' ? 'Indiquez la page concernée et ce que vous avez fait juste avant.' : undefined} />
      </div>
      <Button type="submit" loading={status.state === 'loading'}>Envoyer le message</Button>
    </form>
  )
}

export function Contact() {
  usePageTitle('Contact')
  return (
    <div className="container">
      <header className="page-hero">
        <h1>Nous contacter</h1>
        <p>Une question, un problème, une idée ou un projet pour votre établissement : nous lisons tout.</p>
      </header>
      <div className="grid-main">
        <div className="panel"><ContactForm /></div>
        <aside className="stack">
          <div className="row"><Clock size={18} color="var(--blue)" aria-hidden /><span className="small">Réponse sous 48 h ouvrées</span></div>
          <div className="row"><Mail size={18} color="var(--blue)" aria-hidden /><span className="small">bonjour@folio.ma</span></div>
          <div className="row"><School size={18} color="var(--blue)" aria-hidden /><span className="small">Établissements : choisissez « Offre établissement » pour recevoir un devis.</span></div>
        </aside>
      </div>
    </div>
  )
}
