# Folio — plateforme d’apprentissage intelligente

Folio lit les cours PDF des étudiants et en fait du matériel de révision : titre, résumé,
explication, points clés, glossaire et FAQ ; un assistant qui répond **uniquement à partir du
document** en citant les pages ; des quiz notés avec historique ; des fiches à répétition
espacée ; des notes ; un planning d’examen et un minuteur Pomodoro.

| | |
|---|---|
| **Backend** | Python 3.12, Django 5.1, Django REST Framework, JWT (SimpleJWT), PostgreSQL |
| **IA** | Ollama (Qwen2.5), RAG, Sentence-Transformers, Hugging Face Transformers, PyTorch |
| **PDF** | PyMuPDF, pdfplumber (tableaux), Tesseract OCR (pages scannées) |
| **Frontend** | React 18, Vite, JavaScript, React Router, Recharts |
| **Outillage** | Docker Compose, pytest, ruff, ESLint, Git |

---

## Démarrage rapide (Docker)

```bash
docker compose up --build
```

Ouvrez <http://localhost:8080>. Au premier lancement, le modèle Qwen2.5 (~4,7 Go) est
téléchargé une fois et un compte de démonstration est créé :

- **E-mail** : `demo@folio.ma`
- **Mot de passe** : `Folio-Demo-2026`

Administration Django : <http://localhost:8080/admin/> (créez un superutilisateur avec
`docker compose exec backend python manage.py createsuperuser`).

## Démarrage en local (développement)

Prérequis : Python 3.12+, Node 20+, PostgreSQL 16, [Ollama](https://ollama.com),
Tesseract (`apt install tesseract-ocr tesseract-ocr-fra` ou `brew install tesseract tesseract-lang`).

```bash
# 1. Modèle local
ollama pull qwen2.5:7b

# 2. Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env            # USE_SQLITE=1 pour essayer sans PostgreSQL
python manage.py makemigrations accounts documents chat quizzes flashcards notes planner support
python manage.py migrate
python manage.py seed_demo      # compte de démonstration
python manage.py runserver      # http://localhost:8000

# 3. Frontend (autre terminal)
cd frontend
npm install
npm run dev                     # http://localhost:5173 (proxy /api → :8000)
```

> Les migrations ne sont pas versionnées dans ce premier commit : la commande
> `makemigrations` ci-dessus les génère. Versionnez ensuite le dossier `migrations/` de chaque app.

`make help` liste les raccourcis (installation, migrations, tests, lint, Docker).

### Sans GPU ni Ollama

Folio fonctionne aussi **sans le modèle de langage** : chaque générateur a un mode
« extraits » qui réutilise uniquement des phrases du document (résumé extractif, glossaire
par détection de définitions, quiz à trous, réponses citant les passages). Un badge
« Mode extraits » l’indique dans l’interface. `EMBEDDING_LIGHT=1` remplace aussi
Sentence-Transformers par un encodeur léger (utile pour la CI).

---

## Fonctionnalités

**Site public** — accueil, fonctionnalités, tarifs (Gratuit / Étudiant Pro / Établissement),
à propos, FAQ avec recherche, contact (dont demandes établissements), CGU, confidentialité
(loi 09-08), newsletter.

**Compte** — inscription, connexion JWT avec rafraîchissement, mot de passe oublié par
e-mail, profil (établissement, filière, niveau, objectif quotidien, photo), thème clair /
sombre, suppression du compte, quotas d’offre.

**Bibliothèque** — dépôt multiple par glisser-déposer, matières colorées, recherche, filtres,
tri, vue grille / liste, favoris, suivi de l’analyse en direct, relance après échec.

**Espace document** (onglets) — Résumé · Explication · L’essentiel (points clés + glossaire,
copiable) · FAQ · Assistant · Quiz · Fiches · Notes · Texte (lecteur page par page,
recherche plein texte, ouverture du PDF à la page).

**Assistant RAG** — conversations par document, citations cliquables `[n]` avec page et
extrait, refus explicite hors document, questions de relance, retour utile / pas utile,
export Markdown, épinglage.

**Quiz** — génération (thème, nombre, difficulté, QCM / vrai-faux, chronomètre), raccourcis
clavier, correction détaillée avec page source, « Revoir mes erreurs », historique et courbe.

**Fiches** — génération ou création manuelle, révision sur fiches lignées avec retournement,
algorithme SM-2 (4 notes), file du jour.

**S’organiser** — notes colorées liées aux pages, tâches, examens avec plan de révision jour
par jour converti en tâches, Pomodoro persistant, progression (séries, carte d’activité,
maîtrise par cours, badges), recherche globale `Ctrl+K`, centre d’aide.

---

## Architecture

```
folio/
├── backend/
│   ├── ai/              # cœur IA sans Django : extraction, découpage, embeddings,
│   │                    # retrieval, client Ollama, prompts, StudyAI (+ repli extractif)
│   ├── apps/
│   │   ├── core/        # modèles de base, erreurs, tâches de fond, composition de l’IA
│   │   ├── accounts/    # utilisateurs, JWT, offres, mot de passe oublié
│   │   ├── documents/   # PDF, pages, passages indexés, pipeline d’analyse
│   │   ├── chat/        # conversations RAG
│   │   ├── quizzes/     # quiz, tentatives, correction
│   │   ├── flashcards/  # paquets, fiches, SM-2
│   │   ├── notes/       # notes
│   │   ├── planner/     # examens, plans de révision, tâches, sessions
│   │   ├── analytics/   # tableau de bord, activité, progression, recherche
│   │   └── support/     # contact, newsletter
│   └── config/          # settings base / dev / prod / test
├── frontend/src/
│   ├── api/             # client axios (JWT) + un module par app backend
│   ├── components/      # ui/ (kit), layout/, documents/, chat/, quiz/, flashcards/…
│   ├── context/         # auth, thème, toasts, minuteur
│   ├── pages/           # public/, auth/, app/
│   └── styles/          # jetons de design, composants, mises en page
└── docs/                # ARCHITECTURE.md, API.md, BUSINESS.md
```

Détails : [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · Endpoints : [docs/API.md](docs/API.md) ·
Modèle économique : [docs/BUSINESS.md](docs/BUSINESS.md)

## Tests et qualité

```bash
cd backend && pytest          # cœur IA, API de chaque app, SM-2, plan de révision, séries
cd backend && ruff check .
cd frontend && npm run lint
```

## Variables d’environnement

Voir [`backend/.env.example`](backend/.env.example) : base de données, durée des jetons JWT,
URL et modèle Ollama, modèle d’embeddings, OCR, e-mail, limites de l’offre gratuite.
