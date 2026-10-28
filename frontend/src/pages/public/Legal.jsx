import { usePageTitle } from '@/hooks/misc'

const UPDATED = '28 octobre 2026'

function LegalPage({ title, children }) {
  usePageTitle(title)
  return (
    <div className="container">
      <header className="page-hero">
        <h1>{title}</h1>
        <p>Dernière mise à jour : {UPDATED}</p>
      </header>
      <div className="legal">{children}</div>
    </div>
  )
}

export function Terms() {
  return (
    <LegalPage title="Conditions d’utilisation">
      <p className="alert alert--warn">Modèle de conditions fourni avec le projet : à faire relire par un juriste avant la mise en production.</p>
      <h2>1. Objet</h2>
      <p>Folio est un service en ligne d’aide à l’étude qui analyse les documents PDF déposés par l’utilisateur pour produire des résumés, explications, quiz, fiches de révision et réponses à des questions.</p>
      <h2>2. Compte</h2>
      <p>L’utilisateur fournit des informations exactes lors de son inscription et garde son mot de passe confidentiel. Il est responsable de l’activité de son compte.</p>
      <h2>3. Documents déposés</h2>
      <p>L’utilisateur garantit disposer des droits nécessaires sur les documents qu’il dépose, pour un usage personnel d’étude. Folio n’acquiert aucun droit sur ces documents et ne les rend jamais accessibles à d’autres utilisateurs.</p>
      <h2>4. Contenus générés</h2>
      <p>Les contenus produits par Folio sont générés automatiquement à partir des documents. Ils peuvent comporter des erreurs ; les citations permettent de les vérifier. Ils ne remplacent pas l’enseignement reçu.</p>
      <h2>5. Usage acceptable</h2>
      <p>Il est interdit d’utiliser Folio pour frauder à un examen, de tenter d’accéder aux données d’autres utilisateurs ou de perturber le service.</p>
      <h2>6. Offres et paiement</h2>
      <p>L’offre gratuite est soumise aux limites affichées sur la page Tarifs. L’offre Étudiant Pro est payable mensuellement ou annuellement et résiliable à tout moment ; la résiliation prend effet à la fin de la période payée.</p>
      <h2>7. Résiliation</h2>
      <p>L’utilisateur peut supprimer son compte à tout moment depuis ses paramètres. Toutes ses données sont alors effacées.</p>
      <h2>8. Droit applicable</h2>
      <p>Les présentes conditions sont soumises au droit marocain.</p>
    </LegalPage>
  )
}

export function Privacy() {
  return (
    <LegalPage title="Politique de confidentialité">
      <p className="alert alert--warn">Modèle de politique fourni avec le projet : à compléter (responsable de traitement, numéro de déclaration CNDP) et à faire valider avant la mise en production.</p>
      <h2>Données collectées</h2>
      <p>Données de compte (nom, e-mail, établissement, filière, niveau), documents déposés et contenus générés à partir d’eux, activité d’étude (quiz, fiches, sessions, notes), messages envoyés au support.</p>
      <h2>Finalités</h2>
      <p>Fournir le service, sécuriser les comptes, répondre aux demandes, améliorer l’ergonomie à partir de statistiques agrégées. Les documents ne sont jamais utilisés pour entraîner un modèle d’intelligence artificielle.</p>
      <h2>Traitement par l’IA</h2>
      <p>Les modèles d’analyse et de génération sont exécutés sur les serveurs de Folio. Le contenu des documents n’est pas transmis à des services d’IA tiers.</p>
      <h2>Conservation</h2>
      <p>Les données sont conservées tant que le compte est actif. La suppression du compte efface les documents et contenus associés.</p>
      <h2>Vos droits</h2>
      <p>Conformément à la loi n° 09-08 relative à la protection des personnes physiques à l’égard du traitement des données à caractère personnel, vous disposez d’un droit d’accès, de rectification et d’opposition. Écrivez à confidentialite@folio.ma. Vous pouvez également saisir la CNDP.</p>
      <h2>Cookies</h2>
      <p>Folio n’utilise pas de cookies publicitaires. Le stockage local du navigateur sert uniquement à garder votre session et vos préférences d’affichage.</p>
    </LegalPage>
  )
}
