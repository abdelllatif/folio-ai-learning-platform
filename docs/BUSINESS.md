# Folio — note de développement commercial

> Les chiffres ci-dessous sont des **hypothèses de travail** à valider par des entretiens
> et un pilote ; ils servent à structurer les décisions, pas à les remplacer.

## Problème

Un étudiant reçoit des centaines de pages de PDF par semestre (polycopiés, slides exportées,
TD, annales). Il relit, surligne, recopie — des méthodes peu efficaces. Les méthodes qui
marchent (s’interroger, espacer les révisions, reformuler) demandent un travail de
préparation que presque personne ne fait.

Les assistants IA généralistes aident, mais **inventent** parfois et ne disent pas d’où vient
l’information : inacceptable pour réviser un examen.

## Proposition de valeur

« Déposez votre cours ; Folio prépare vos révisions et répond en citant la page. »

| Pour l’étudiant | Pour l’établissement |
|---|---|
| Gain de temps de préparation | Outil de révision fiable et cadré sur le cours |
| Réponses vérifiables (page source) | Données hébergées par le prestataire, pas d’IA tierce |
| Méthode guidée : quiz → erreurs → fiches → planning | Suivi de l’usage par classe |

## Cibles

1. **Étudiants universitaires** (licence, master) — gros volumes de PDF, examens semestriels.
2. **Lycéens en année de bac** et **classes prépas** — forte pression, besoin de planning.
3. **B2B2C** : écoles privées, centres de soutien scolaire, universités — achat de licences
   pour une classe ou un campus.

## Offres et prix

| Offre | Prix | Rôle |
|---|---|---|
| Gratuit | 0 DH | Acquisition : toutes les fonctions, 15 documents, 25 Mo |
| Étudiant Pro | 39 DH / mois, 349 DH / an | Revenu principal B2C ; illimité, 100 Mo |
| Établissement | sur devis (repère : 150–250 DH / élève / an) | Revenu prévisible, distribution |

Pourquoi limiter le **nombre de documents** plutôt que les fonctions : l’étudiant découvre
toute la valeur gratuitement, et le besoin de payer arrive naturellement au milieu du
semestre, quand la bibliothèque se remplit. Le message de quota mène directement à l’offre
Pro (code `quota_exceeded`, HTTP 402).

## Coûts (ordre de grandeur)

- Les modèles tournent en local (Ollama / Qwen2.5 7B) : **pas de coût par requête** à un
  fournisseur d’IA, coût dominé par les GPU.
- Hypothèse : un serveur GPU (≈ 24 Go) traite l’analyse et les questions de quelques
  centaines d’étudiants actifs simultanément en dehors des pics d’examens.
- Le mode extractif sert de soupape : en cas de surcharge, le service reste utilisable.

## Indicateurs à suivre

| Étape | Indicateur | Où le mesurer |
|---|---|---|
| Activation | % d’inscrits qui déposent un document en 24 h | `documents.created_at` |
| Valeur | % qui font un quiz ou posent 3 questions dans la semaine | `attempts`, `messages` |
| Rétention | Séries ≥ 3 jours, révisions de fiches J+7 | `analytics.streaks`, `card_reviews` |
| Qualité IA | Taux de réponses « utiles » / refus | `messages.feedback`, `grounded` |
| Monétisation | Conversion gratuit → Pro au quota | `quota_exceeded` → changement d’offre |
| B2B | Demandes « établissement » → devis → signature | `support.ContactMessage(topic=school)` |

## Mise sur le marché (Maroc d’abord)

1. **Pilote** avec 2–3 filières (informatique, économie, médecine) dans une université de
   Casablanca : ambassadeurs étudiants, présentation en amphi, offre Pro gratuite un semestre.
2. **Contenu** : conseils de révision mensuels (newsletter déjà en place), calendrier des
   examens, tutoriels courts.
3. **Pics saisonniers** : campagnes avant les partiels de janvier et de juin ; offre annuelle
   mise en avant en septembre.
4. **B2B** : centres de soutien et écoles privées — démonstration avec leurs propres
   polycopiés, devis par classe.
5. **Langues** : français, anglais et arabe sont déjà pris en charge par l’analyse.

## Feuille de route produit

| Horizon | Contenu |
|---|---|
| Court terme | Paiement CMI / Stripe, file Celery, export PDF des fiches, application mobile (PWA) |
| Moyen terme | Espace enseignant (partage de documents à une classe, statistiques agrégées), quiz partagés entre camarades |
| Long terme | Mode examen blanc multi-documents, cartes mentales générées, intégration Moodle / Google Classroom |

## Risques

| Risque | Réponse |
|---|---|
| Hallucinations | RAG strict, citations obligatoires, refus explicite, retour utilisateur |
| Droits sur les documents | CGU : usage personnel d’étude ; aucun partage entre comptes |
| Usage frauduleux en examen | Positionnement « réviser », pas « répondre à ma place » |
| Coût GPU en période d’examens | Priorité Pro, mode extractif, file d’attente visible |
