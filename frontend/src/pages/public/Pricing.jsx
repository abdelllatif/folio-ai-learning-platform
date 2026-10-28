import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Check, Minus } from 'lucide-react'
import { Button } from '@/components/ui'
import { usePageTitle } from '@/hooks/misc'
import { PLANS } from '@/utils/constants'

const ROWS = [
  ['Documents', '15', 'Illimités', 'Illimités'],
  ['Taille maximale d’un PDF', '25 Mo', '100 Mo', '100 Mo'],
  ['Résumé, explication, glossaire, FAQ', true, true, true],
  ['Assistant avec citations', true, true, true],
  ['Quiz et historique des scores', true, true, true],
  ['Fiches à répétition espacée', true, true, true],
  ['Planning d’examen et Pomodoro', true, true, true],
  ['Comptes pour une classe ou un campus', false, false, true],
  ['Suivi d’usage pour les enseignants', false, false, true],
  ['Accompagnement à la prise en main', false, false, true],
]

const Cell = ({ v }) => (v === true ? <Check size={18} color="var(--mint)" aria-label="Inclus" />
  : v === false ? <Minus size={18} color="var(--ink-3)" aria-label="Non inclus" /> : v)

export function Pricing() {
  usePageTitle('Tarifs')
  const { hash } = useLocation()
  useEffect(() => { if (hash) document.querySelector(hash)?.scrollIntoView() }, [hash])

  return (
    <div className="container">
      <header className="page-hero">
        <h1>Un prix d’étudiant</h1>
        <p>Toutes les fonctionnalités sont dans l’offre gratuite. L’offre Pro retire la limite de documents.</p>
      </header>

      <div className="plans">
        <div className="plan">
          <h3>{PLANS.free.name}</h3>
          <div className="plan__price">{PLANS.free.price} <small>{PLANS.free.period}</small></div>
          <p className="muted small">Pour découvrir Folio sur un semestre.</p>
          <ul>
            <li><Check aria-hidden />15 documents, 25 Mo par fichier</li>
            <li><Check aria-hidden />Toutes les fonctions d’étude</li>
            <li><Check aria-hidden />Sans carte bancaire</li>
          </ul>
          <Button to="/inscription" variant="secondary" block>Créer un compte</Button>
        </div>
        <div className="plan plan--featured">
          <div className="row-between"><h3>{PLANS.pro.name}</h3><span className="badge badge--blue">Le plus choisi</span></div>
          <div className="plan__price">{PLANS.pro.price} <small>{PLANS.pro.period}</small></div>
          <p className="muted small">Pour toute une année de cours, sans compter.</p>
          <ul>
            <li><Check aria-hidden />Documents illimités</li>
            <li><Check aria-hidden />Fichiers jusqu’à 100 Mo</li>
            <li><Check aria-hidden />Analyse prioritaire en période d’examens</li>
            <li><Check aria-hidden />Résiliable à tout moment</li>
          </ul>
          <Button to="/inscription?offre=pro" block>Commencer avec Pro</Button>
        </div>
        <div className="plan" id="etablissements">
          <h3>{PLANS.school.name}</h3>
          <div className="plan__price" style={{ fontSize: '1.7rem' }}>{PLANS.school.price}</div>
          <p className="muted small">{PLANS.school.period}. Lycées, écoles, universités, centres de soutien.</p>
          <ul>
            <li><Check aria-hidden />Comptes Pro pour chaque élève</li>
            <li><Check aria-hidden />Suivi d’usage par classe</li>
            <li><Check aria-hidden />Facturation annuelle à l’établissement</li>
          </ul>
          <Button to="/contact?sujet=school" variant="secondary" block>Demander un devis</Button>
        </div>
      </div>

      <section className="section">
        <h2 style={{ fontSize: 'var(--fs-xl)' }}>Comparer les offres</h2>
        <div className="panel panel--flush table-wrap">
          <table className="table">
            <thead><tr><th scope="col">Fonction</th><th scope="col">Gratuit</th><th scope="col">Étudiant Pro</th><th scope="col">Établissement</th></tr></thead>
            <tbody>
              {ROWS.map(([label, ...vals]) => (
                <tr key={label}><th scope="row" style={{ fontWeight: 400, color: 'var(--ink)' }}>{label}</th>{vals.map((v, i) => <td key={i}><Cell v={v} /></td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small muted" style={{ marginTop: '1rem' }}>Prix en dirhams TTC. Tarif annuel Pro : 349 DH, soit trois mois offerts.</p>
      </section>
    </div>
  )
}
