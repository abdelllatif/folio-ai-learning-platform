# Architecture

## Principes

1. **Le cœur IA ne dépend pas de Django.** Le paquet `backend/ai/` ne contient que du Python
   (numpy, requests). Il définit des *ports* — `Embedder`, `LLMClient` — et des *adaptateurs*
   (Sentence-Transformers, encodeur de hachage, Ollama). Il se teste seul et peut être réutilisé
   ailleurs (worker, CLI).
2. **Une seule racine de composition.** `apps/core/ai.py::get_ai()` construit les adaptateurs à
   partir des settings. Le reste de Django dépend de `get_ai()`, jamais d’Ollama ou de torch.
3. **Services / sélecteurs.** Dans chaque app, `services.py` contient les cas d’usage qui
   modifient l’état, `selectors.py` les lectures. Les vues DRF restent minces.
4. **Dégradation gracieuse.** Chaque générateur essaie le LLM puis bascule sur un repli
   extractif qui ne réutilise que des phrases du document. `generated_by` trace la source.
5. **Isolation des données.** Tous les querysets filtrent sur l’utilisateur ; les relations
   reçues du client (document, matière, examen) sont validées comme appartenant à l’utilisateur.

## Pipeline d’analyse d’un PDF

```
Dépôt (POST /documents/)
  ├─ contrôle : extension + octets magiques %PDF-, quota de l’offre
  └─ file d’attente (apps/core/tasks.enqueue — thread, remplaçable par Celery)
        │
        ▼
process_document(id)
  1. extraction   ai.extraction.extract_pdf
                  PyMuPDF par page → pdfplumber pour les pages pauvres (tableaux)
                  → Tesseract si la page reste vide (scan) ; nettoyage des en-têtes,
                  pieds de page, césures ; titres gardés à part
  2. découpage    ai.chunking.chunk_pages — ~900 caractères alignés sur les phrases,
                  recouvrement 150, chaque passage connaît ses pages
  3. indexation   embeddings normalisés (multilingual MiniLM) stockés en float32
  4. analyse      StudyAI.analyze — titre, résumés, points clés, mots-clés, matière,
                  niveau, catégorie, explication, glossaire, FAQ
                  (map-reduce si le document dépasse la fenêtre de contexte)
  5. enregistrement atomique ; status = ready, progress = 100
```

L’interface interroge `GET /documents/{id}/status/` toutes les 3 s pour afficher l’étape.

## RAG (assistant)

```
question
  → embedding de la question
  → score = 0,85 · cosinus + 0,15 · recouvrement lexical
  → seuil de pertinence (dépend de l’encodeur) — sinon refus sans appeler le LLM
  → MMR pour éviter cinq passages quasi identiques
  → prompt : extraits numérotés [1..k] + règles (répondre seulement à partir des extraits,
    citer [n], phrase de refus exacte)
  → réponse ; les marqueurs [n] sont convertis en citations {page, extrait, score}
  → 3 questions de relance (best effort)
```

L’index d’un document est mis en cache en mémoire par version (`processed_at`).

## Quiz et fiches

- Les passages source sont répartis sur tout le document, ou choisis par recherche
  sémantique quand l’étudiant précise un thème (refus si le thème est absent).
- Les questions du LLM sont validées (type, nombre de choix, index de réponse, doublons).
- Les bonnes réponses ne quittent jamais le serveur avant la soumission.
- Fiches : SM-2 dans `apps/flashcards/sm2.py`, fonction pure testée.

## Frontend

- Routage paresseux (`routes.jsx`) : le site public ne charge pas l’espace étudiant.
- `api/client.js` : jeton d’accès ajouté, rafraîchissement unique partagé entre requêtes
  concurrentes, erreurs normalisées `{code, message, details, status}`.
- État : contextes pour l’authentification, le thème, les toasts et le minuteur ; `useApi`
  pour les chargements ; pas de store global.
- Design : jetons CSS (`styles/tokens.css`), thème sombre, Lexend pour l’interface,
  Literata pour le contenu de cours ; le surligneur (`.hl`) est l’élément signature.

## Passage à l’échelle

| Besoin | Évolution prévue |
|---|---|
| Analyses en parallèle | remplacer `core/tasks.enqueue` par Celery + Redis (même signature) |
| Grands volumes de passages | pgvector à la place du stockage binaire + recherche en mémoire |
| Plusieurs serveurs d’inférence | plusieurs instances Ollama derrière un répartiteur, ou vLLM |
| Paiement | webhook CMI / Stripe qui remplace `POST /auth/me/plan/` |
