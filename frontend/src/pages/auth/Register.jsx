import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fieldErrors } from '@/api/client'
import { Alert, Button, Input, Select } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { usePageTitle } from '@/hooks/misc'
import { LEVELS } from '@/utils/constants'

function passwordStrength(pw) {
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return Math.min(4, score)
}
const STRENGTH = ['Trop court', 'Faible', 'Moyen', 'Bon', 'Excellent']
const STRENGTH_TONE = ['coral', 'coral', 'amber', 'mint', 'mint']

export function Register() {
  usePageTitle('Créer un compte')
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', password: '', school: '', field_of_study: '',
    level: 'licence', accept_terms: false,
  })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const strength = passwordStrength(form.password)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    setError(null)
    try {
      await register({ ...form, email: form.email.trim() })
      navigate('/app?bienvenue=1', { replace: true })
    } catch (err) {
      const fe = fieldErrors(err)
      setErrors(fe)
      if (fe.non_field_errors) setErrors({ ...fe, password: fe.non_field_errors })
      if (!Object.keys(fe).length) setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h1>Créer votre compte</h1>
      <p className="muted">Gratuit jusqu’à 15 documents. Sans carte bancaire.</p>
      <form onSubmit={submit} className="stack" style={{ marginTop: '1.5rem' }} noValidate>
        {error && <Alert kind="error">{error}</Alert>}
        <div className="form-grid">
          <Input label="Prénom" required autoComplete="given-name" value={form.first_name} onChange={set('first_name')} error={errors.first_name} />
          <Input label="Nom" autoComplete="family-name" value={form.last_name} onChange={set('last_name')} error={errors.last_name} />
        </div>
        <Input label="E-mail" type="email" required autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} />
        <div>
          <Input label="Mot de passe" type="password" required autoComplete="new-password" value={form.password}
            onChange={set('password')} error={errors.password} hint="8 caractères minimum, évitez les mots trop simples." />
          {form.password && (
            <div className="row" style={{ marginTop: '0.4rem' }}>
              <div className={`progress progress--${STRENGTH_TONE[strength]} grow`} style={{ height: 5 }}>
                <div className="progress__bar" style={{ width: `${(strength / 4) * 100}%` }} />
              </div>
              <span className="tiny muted" style={{ width: 70 }}>{STRENGTH[strength]}</span>
            </div>
          )}
        </div>
        <div className="form-grid">
          <Select label="Niveau" options={LEVELS} value={form.level} onChange={set('level')} />
          <Input label="Filière" placeholder="ex. Informatique" value={form.field_of_study} onChange={set('field_of_study')} />
        </div>
        <Input label="Établissement" placeholder="ex. Université Hassan II" value={form.school} onChange={set('school')} hint="Facultatif" />
        <label className="checkbox">
          <input type="checkbox" checked={form.accept_terms} onChange={set('accept_terms')} />
          <span>J’accepte les <Link to="/conditions" target="_blank">conditions d’utilisation</Link> et la <Link to="/confidentialite" target="_blank">politique de confidentialité</Link>.</span>
        </label>
        {errors.accept_terms && <span className="field__error">{errors.accept_terms}</span>}
        <Button type="submit" block size="lg" loading={loading}>Créer mon compte</Button>
      </form>
      <p className="small muted" style={{ marginTop: '1.5rem' }}>Déjà inscrit ? <Link to="/connexion">Se connecter</Link></p>
    </>
  )
}
