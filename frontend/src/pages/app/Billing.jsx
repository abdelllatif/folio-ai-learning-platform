import { useState } from 'react'
import { Check } from 'lucide-react'
import { authApi } from '@/api'
import { Alert, Button, ConfirmDialog, ProgressBar } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { usePageTitle } from '@/hooks/misc'
import { PLANS } from '@/utils/constants'

export function Billing() {
  usePageTitle('Abonnement')
  const { user, setUser } = useAuth()
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const [confirmDowngrade, setConfirmDowngrade] = useState(false)
  const usage = user.usage
  const isPro = user.plan === 'pro'

  const change = async (plan) => {
    setBusy(true)
    try {
      setUser(await authApi.changePlan(plan))
      toast.success(plan === 'pro' ? 'Bienvenue dans Étudiant Pro.' : 'Vous êtes repassé à l’offre gratuite.')
    } catch (err) { toast.error(err) } finally { setBusy(false); setConfirmDowngrade(false) }
  }

  return (
    <>
      <div className="page-head"><div><h1>Abonnement</h1><p>Votre offre et votre utilisation.</p></div></div>
      <div className="grid-2" style={{ alignItems: 'start' }}>
        <section className="panel">
          <span className="small muted">Offre actuelle</span>
          <h2 style={{ fontSize: 'var(--fs-xl)', margin: '0.2rem 0 1rem' }}>{PLANS[user.plan].name}</h2>
          <div className="row-between small"><span>Documents</span><span>{usage.documents_used}{usage.documents_limit ? ` / ${usage.documents_limit}` : ' (illimités)'}</span></div>
          {usage.documents_limit && <ProgressBar value={(100 * usage.documents_used) / usage.documents_limit} tone={usage.documents_used >= usage.documents_limit ? 'coral' : undefined} label="Documents utilisés" />}
          <div className="row-between small" style={{ marginTop: '0.75rem' }}><span>Taille maximale d’un PDF</span><span>{usage.max_file_mb} Mo</span></div>
          {isPro && <div className="panel__foot"><Button variant="ghost" size="sm" onClick={() => setConfirmDowngrade(true)}>Revenir à l’offre gratuite</Button></div>}
        </section>

        {!isPro && (
          <section className="panel plan--featured" style={{ borderWidth: 2 }}>
            <h2 style={{ fontSize: 'var(--fs-md)' }}>{PLANS.pro.name}</h2>
            <div className="plan__price">{PLANS.pro.price} <small>{PLANS.pro.period}</small></div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0', display: 'grid', gap: '0.5rem' }} className="small">
              {['Documents illimités', 'PDF jusqu’à 100 Mo', 'Analyse prioritaire en période d’examens', 'Résiliable à tout moment'].map((f) => (
                <li key={f} className="row"><Check size={16} color="var(--mint)" aria-hidden />{f}</li>
              ))}
            </ul>
            <Button block onClick={() => change('pro')} loading={busy}>Passer à Étudiant Pro</Button>
            <p className="tiny muted" style={{ margin: '0.6rem 0 0' }}>Ou 349 DH par an, soit trois mois offerts.</p>
          </section>
        )}
      </div>
      <div style={{ marginTop: '1.25rem' }}>
        <Alert title="Environnement de démonstration">
          Le changement d’offre est immédiat et sans paiement. En production, ce bouton ouvre le paiement (CMI ou Stripe) et l’offre est activée par la confirmation du prestataire.
        </Alert>
      </div>
      <ConfirmDialog open={confirmDowngrade} onClose={() => setConfirmDowngrade(false)} onConfirm={() => change('free')} loading={busy} danger={false}
        confirmLabel="Revenir au gratuit" title="Revenir à l’offre gratuite ?"
        message={`Vos documents restent accessibles, mais vous ne pourrez plus en ajouter au-delà de ${15}.`} />
    </>
  )
}
