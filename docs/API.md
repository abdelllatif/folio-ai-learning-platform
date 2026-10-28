# API REST — `/api/v1/`

Authentification : `Authorization: Bearer <access>`. Erreurs :
`{"error": {"code", "message", "details"}}`. Listes paginées :
`{count, next, previous, results}` (`?page=`, `?page_size=` ≤ 100).

## Comptes — `/auth/`

| Méthode | Chemin | Rôle |
|---|---|---|
| POST | `register/` | Inscription → `{user, access, refresh}` |
| POST | `login/` | Connexion → `{user, access, refresh}` |
| POST | `refresh/` | Nouveau jeton d’accès (rotation du refresh) |
| POST | `logout/` | Révoque le refresh |
| GET / PATCH / DELETE | `me/` | Profil (multipart pour la photo), suppression du compte |
| POST | `me/password/` | Changer le mot de passe |
| POST | `me/plan/` | Changer d’offre (démo ; webhook de paiement en production) |
| POST | `password/reset/` · `password/reset/confirm/` | Mot de passe oublié |

## Documents

| Méthode | Chemin | Rôle |
|---|---|---|
| GET | `documents/` | Filtres `status, subject, unsorted, is_favorite, category, language` ; `search` ; `ordering` |
| POST | `documents/` | Dépôt multipart `file`, `subject_id` (402 si quota atteint) |
| GET / PATCH / DELETE | `documents/{id}/` | Détail complet, renommer, ranger, supprimer |
| GET | `documents/{id}/status/` | Avancement de l’analyse |
| POST | `documents/{id}/reprocess/` · `favorite/` · `opened/` | Relancer, favori, position de lecture |
| GET | `documents/{id}/pages/?number=` | Texte page par page |
| GET | `documents/{id}/find/?q=` | Recherche dans le document |
| CRUD | `subjects/` | Matières (avec nombre de documents) |

## Assistant

| Méthode | Chemin | Rôle |
|---|---|---|
| GET / POST | `conversations/?document=` | Fils d’un document / nouveau fil |
| GET / PATCH / DELETE | `conversations/{id}/` | Messages, renommer, épingler |
| POST | `conversations/{id}/ask/` | `{content}` → `{question, answer}` avec `citations`, `grounded`, `follow_ups` |
| GET | `conversations/{id}/export/` | Markdown |
| POST | `messages/{id}/feedback/` | `{value: 1 | -1 | 0}` |

## Quiz

| Méthode | Chemin | Rôle |
|---|---|---|
| GET | `quizzes/?document=` | Avec meilleur / dernier score |
| POST | `quizzes/generate/` | `{document, count, difficulty, kinds, focus, time_limit_minutes}` |
| GET / DELETE | `quizzes/{id}/` | Questions sans les réponses |
| POST | `quizzes/{id}/submit/` | `{answers: {question_id: choice_id|null}, duration_seconds, mode}` |
| GET | `quizzes/{id}/mistakes/` | Questions ratées à la dernière tentative |
| GET | `attempts/` · `attempts/{id}/` | Historique, correction détaillée |

## Fiches

| Méthode | Chemin | Rôle |
|---|---|---|
| CRUD | `decks/` | Paquets (cartes, dues, maîtrisées) |
| POST | `decks/generate/` | `{document, count}` |
| CRUD | `cards/?deck=` | Fiches |
| GET | `cards/due/?deck=` | File de révision |
| POST | `cards/{id}/review/` | `{grade: 0..3}` (SM-2) |

## Notes, planning, statistiques, support

| Méthode | Chemin | Rôle |
|---|---|---|
| CRUD | `notes/` | Filtres `document, color, is_pinned, tag`, recherche |
| GET | `notes/export/` | Fiche Markdown |
| CRUD | `planner/exams/` | `?upcoming=1` |
| GET / POST | `planner/exams/{id}/plan/` · `plan/tasks/` | Plan jour par jour / conversion en tâches |
| CRUD | `planner/tasks/` | `?when=today|overdue|upcoming`, `is_done` |
| GET / POST | `planner/sessions/` | Sessions d’étude (Pomodoro, fiches…) |
| GET | `analytics/dashboard/` · `activity/?days=` · `progress/` · `search/?q=` | Tableau de bord, carte d’activité, maîtrise, recherche globale |
| POST | `support/contact/` · `support/newsletter/` | Public |
| GET | `health/` | Public : état du modèle |
