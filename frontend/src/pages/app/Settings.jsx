import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera } from 'lucide-react'
import { authApi } from '@/api'
import { fieldErrors } from '@/api/client'
import { Avatar } from '@/components/layout/Topbar'
import { Button, ConfirmDialog, Input, Segmented, Select } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { useToast } from '@/context/ToastContext'
import { usePageTitle } from '@/hooks/misc'
import { LEVELS } from '@/utils/constants'

const SECTIONS = [['profil', 'Profil'], ['etudes', 'Études'], ['apparence', 'Apparence'], ['securite', 'Sécurité'], ['compte', 'Compte']]

function Section({ id, title, description, children }) {
  return (
    <section id={id} className="panel" style={{ scrollMarginTop: 'calc(var(--topbar-h) + 1rem)' }}>
      <h2 style={{ fontSize: 'var(--fs-md)', marginBottom: '0.2rem' }}>{title}</h2>
      {description && <p className="small muted">{description}</p>}
      <div style={{ marginTop: '1rem' }}>{children}</div>
    </section>
  )
}

export function Settings() {
  usePageTitle('Paramètres')
  const { user, setUser, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const toast = useToast()
  const navigate = useNavigate()
  const fileRef = useRef(null)
  const [profile, setProfile] = useState({
    first_name: user.first_name, last_name: user.last_name, school: user.school,
    field_of_study: user.field_of_study, level: user.level,
  })
  const [study, setStudy] = useState({ daily_goal_minutes: user.daily_goal_minutes, preferred_language: user.preferred_language })
  const [pw, setPw] = useState({ current: '', next: '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const save = async (key, payload, message) => {
    setSaving(key); setErrors({})
    try {
      const updated = await authApi.updateMe(payload)
      setUser(updated)
      toast.success(message)
    } catch (err) { setErrors(fieldErrors(err)); toast.error(err) } finally { setSaving(null) }
  }
  const changePassword = async (e) => {
    e.preventDefault()
    setSaving('password'); setErrors({})
    try {
      await authApi.changePassword(pw.current, pw.next)
      setPw({ current: '', next: '' })
      toast.success('Mot de passe modifié.')
    } catch (err) { setErrors(fieldErrors(err)) } finally { setSaving(null) }
  }
  const uploadAvatar = async (file) => {
    if (!file) return
    try { setUser(await authApi.uploadAvatar(file)); toast.success('Photo mise à jour.') } catch (err) { toast.error(err) }
  }
  const deleteAccount = async () => {
    await authApi.deleteAccount()
    await logout().catch(() => {})
    navigate('/', { replace: true })
  }

  return (
    <>
      <div className="page-head"><div><h1>Paramètres</h1><p>{user.email}</p></div></div>
      <div className="settings">
        <nav aria-label="Sections des paramètres">
          {SECTIONS.map(([id, label]) => <a key={id} href={`#${id}`} className="side-link">{label}</a>)}
        </nav>
        <div className="stack" style={{ '--stack': '1.25rem' }}>
          <Section id="profil" title="Profil">
            <div className="row" style={{ marginBottom: '1.25rem', gap: '1rem' }}>
              <Avatar user={user} large />
              <div>
                <Button variant="secondary" size="sm" icon={Camera} onClick={() => fileRef.current?.click()}>Changer la photo</Button>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => uploadAvatar(e.target.files[0])} />
                <p className="tiny muted" style={{ margin: '0.3rem 0 0' }}>JPG ou PNG, carrée de préférence.</p>
              </div>
            </div>
            <form className="form-grid" onSubmit={(e) => { e.preventDefault(); save('profile', profile, 'Profil enregistré.') }}>
              <Input label="Prénom" value={profile.first_name} onChange={(e) => setProfile({ ...profile, first_name: e.target.value })} error={errors.first_name} />
              <Input label="Nom" value={profile.last_name} onChange={(e) => setProfile({ ...profile, last_name: e.target.value })} />
              <Input label="Établissement" value={profile.school} onChange={(e) => setProfile({ ...profile, school: e.target.value })} />
              <Input label="Filière" value={profile.field_of_study} onChange={(e) => setProfile({ ...profile, field_of_study: e.target.value })} />
              <Select label="Niveau" options={LEVELS} value={profile.level} onChange={(e) => setProfile({ ...profile, level: e.target.value })} />
              <div className="span-2"><Button type="submit" loading={saving === 'profile'}>Enregistrer le profil</Button></div>
            </form>
          </Section>

          <Section id="etudes" title="Études" description="Votre objectif quotidien alimente l’anneau du tableau de bord et les séries.">
            <form className="form-grid" onSubmit={(e) => { e.preventDefault(); save('study', { ...study, daily_goal_minutes: Number(study.daily_goal_minutes) }, 'Préférences enregistrées.') }}>
              <Select label="Objectif quotidien" value={study.daily_goal_minutes} onChange={(e) => setStudy({ ...study, daily_goal_minutes: e.target.value })}
                options={[15, 25, 30, 45, 60, 90, 120, 180].map((m) => ({ value: m, label: `${m} minutes` }))} />
              <Select label="Langue de l’interface préférée" value={study.preferred_language} onChange={(e) => setStudy({ ...study, preferred_language: e.target.value })}
                options={[{ value: 'fr', label: 'Français' }, { value: 'en', label: 'English' }, { value: 'ar', label: 'العربية' }]}
                hint="Le contenu généré suit toujours la langue du document." />
              <div className="span-2"><Button type="submit" loading={saving === 'study'}>Enregistrer</Button></div>
            </form>
          </Section>

          <Section id="apparence" title="Apparence" description="Le thème sombre fatigue moins les yeux pour réviser le soir.">
            <Segmented value={theme} onChange={setTheme} label="Thème" options={[{ value: 'light', label: 'Clair' }, { value: 'dark', label: 'Sombre' }]} />
          </Section>

          <Section id="securite" title="Sécurité">
            <form className="form-grid" onSubmit={changePassword}>
              <Input label="Mot de passe actuel" type="password" autoComplete="current-password" value={pw.current}
                onChange={(e) => setPw({ ...pw, current: e.target.value })} error={errors.current_password} />
              <Input label="Nouveau mot de passe" type="password" autoComplete="new-password" value={pw.next}
                onChange={(e) => setPw({ ...pw, next: e.target.value })} error={errors.new_password} hint="8 caractères minimum." />
              <div className="span-2"><Button type="submit" loading={saving === 'password'} disabled={!pw.current || !pw.next}>Changer le mot de passe</Button></div>
            </form>
          </Section>

          <Section id="compte" title="Compte" description="La suppression efface définitivement vos documents, conversations, quiz, fiches, notes et votre planning.">
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>Supprimer mon compte</Button>
          </Section>
        </div>
      </div>
      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={deleteAccount}
        title="Supprimer votre compte ?" confirmLabel="Supprimer définitivement"
        message="Toutes vos données seront effacées. Cette action ne peut pas être annulée." />
    </>
  )
}
