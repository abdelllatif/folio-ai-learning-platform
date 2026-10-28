"""Prompt templates. Every prompt pins the output language to the document's language
and asks for strict JSON where the result is structured."""

LANG_NAMES = {"fr": "français", "en": "anglais (English)", "ar": "arabe (العربية)"}


def lang_name(code: str) -> str:
    return LANG_NAMES.get(code, "français")


SYSTEM_TUTOR = (
    "Tu es Folio, un tuteur pédagogique bienveillant pour étudiants. Tu es précis, clair, "
    "et tu ne inventes jamais d'information absente du document fourni."
)

SECTION_SUMMARY = """Résume l'extrait de cours suivant en 4 à 6 phrases, en {lang}.
Conserve les définitions, formules et chiffres importants. Pas d'introduction.

EXTRAIT :
\"\"\"{text}\"\"\""""

ANALYSIS = """Analyse ce document de cours et réponds en {lang}, uniquement en JSON valide
avec exactement ces clés :
{{
  "title": "titre clair et précis du document (max 12 mots)",
  "short_summary": "résumé en 2 phrases",
  "summary": "résumé structuré de 250 à 400 mots, paragraphes séparés par \\n\\n",
  "key_points": ["6 à 10 points essentiels, une phrase chacun"],
  "keywords": ["8 à 12 mots-clés"],
  "subject": "matière (ex : Informatique, Droit, Biologie, Économie…)",
  "level": "niveau estimé (Lycée, Licence, Master…)",
  "category": "type (Cours, TD, Examen, Article, Rapport, Livre, Autre)"
}}

DOCUMENT :
\"\"\"{text}\"\"\""""

EXPLANATION = """Explique ce cours à un étudiant qui le découvre, en {lang}.
Structure attendue (Markdown) :
## L'idée générale
## Les notions clés (chacune expliquée simplement, avec un exemple concret)
## Comment les notions s'enchaînent
## Pièges fréquents
## Pour aller plus loin (3 questions de réflexion)
N'ajoute aucun fait absent du document ; les exemples doivent rester fidèles au contenu.

DOCUMENT :
\"\"\"{text}\"\"\""""

STUDY_AIDS = """À partir du document, produis en {lang} un JSON valide :
{{
  "glossary": [{{"term": "...", "definition": "définition tirée du document"}}],
  "faq": [{{"question": "question qu'un étudiant se poserait", "answer": "réponse tirée du document"}}]
}}
8 à 15 termes de glossaire, 6 à 10 questions de FAQ. Aucune information extérieure.

DOCUMENT :
\"\"\"{text}\"\"\""""

QUIZ = """Crée {n} questions de quiz de difficulté « {difficulty} » en {lang} à partir
UNIQUEMENT des extraits ci-dessous. Types autorisés : {types}.
- "mcq" : 4 choix, une seule bonne réponse, distracteurs plausibles.
- "true_false" : choices = ["Vrai", "Faux"] (ou ["True", "False"] en anglais).
Chaque question indique la page source (nombre entre crochets avant l'extrait).
Réponds uniquement en JSON valide :
{{"questions": [{{"type": "mcq", "question": "...", "choices": ["...", "...", "...", "..."],
  "answer_index": 0, "explanation": "pourquoi c'est la bonne réponse", "page": 1}}]}}

EXTRAITS :
{context}"""

FLASHCARDS = """Crée {n} fiches de révision (flashcards) en {lang} à partir des extraits.
Recto : une question courte ou un terme. Verso : la réponse concise (1 à 3 phrases).
Réponds uniquement en JSON valide :
{{"cards": [{{"front": "...", "back": "...", "page": 1}}]}}

EXTRAITS :
{context}"""

RAG_SYSTEM = """Tu es l'assistant d'étude Folio. Tu réponds UNIQUEMENT à partir des extraits
numérotés du document fournis par l'utilisateur.
Règles :
1. Chaque affirmation est suivie de la référence de l'extrait entre crochets, ex. [1] ou [2][3].
2. Si les extraits ne contiennent pas la réponse, réponds exactement :
   « {refusal} »
3. Pas de connaissances extérieures, pas de suppositions.
4. Réponds en {lang}, de façon claire et pédagogique (listes si utile, 250 mots max)."""

RAG_USER = """EXTRAITS DU DOCUMENT :
{context}

QUESTION : {question}"""

FOLLOW_UPS = """Propose 3 questions de suivi courtes (max 12 mots) qu'un étudiant pourrait poser
sur ce document après cet échange, en {lang}. JSON : {{"questions": ["...", "...", "..."]}}

Question : {question}
Réponse : {answer}"""

REFUSAL = {
    "fr": "Je ne trouve pas cette information dans le document.",
    "en": "I can't find this information in the document.",
    "ar": "لا أجد هذه المعلومة في المستند.",
}
