"""Extractive generators used when the LLM is unreachable.

They are deliberately simple and conservative: they only ever reuse sentences from the
document, so the "answer only from the document" promise holds even offline.
"""
import random
import re

from .textproc import (
    STRUCTURE_WORDS,
    extract_keywords,
    first_heading,
    is_noise_sentence,
    rank_sentences,
    split_sentences,
    truncate,
)
from .types import FlashcardDraft, QuestionDraft, ScoredChunk

DEFINITION_PATTERNS = [
    re.compile(r"^(?:on appelle|on nomme)\s+(?P<term>[^,]{2,60}?)\s+(?P<def>.{15,})$", re.I),
    re.compile(r"^(?P<term>[A-ZÀ-Ý][\w\s'’-]{1,60}?)\s*(?::|—|-)\s+(?P<def>.{15,})$"),
    re.compile(r"^(?:les\s|l[ae]\s|l['’]|un\s|une\s|des\s)?(?P<term>[\w'’-]+(?:\s[\w'’-]+){0,4})\s+"
               r"(?:est|sont|désigne|désignent|correspond à|se définit comme|"
               r"is|are|refers to|means)\s+(?P<def>.{15,})$", re.I),
]
HEADING_WORDS = re.compile(r"^(chapitre|chapter|partie|part|section|annexe|module|leçon)\b|^\d", re.I)
BAD_TERM_START = {
    "ce", "ces", "cet", "cette", "cela", "il", "elle", "on", "ils", "elles", "mes", "tes", "ses",
    "nos", "vos", "leur", "leurs", "notre", "votre", "chaque", "tout", "toute", "tous", "nous",
    "vous", "je", "this", "these", "it", "a", "à", "s", "l", "d",
}
LEADING_ARTICLE = re.compile(r"^(les|le|la|l['’]|un|une|des|the|an?)\s*", re.I)


def _good_term(term: str) -> bool:
    words = term.lower().split()
    letters = sum(c.isalpha() for c in term)
    return (letters >= 3 and words[0] not in BAD_TERM_START and words[0] not in STRUCTURE_WORDS
            and not term.isupper())


TF_LABELS = {"fr": ["Vrai", "Faux"], "en": ["True", "False"], "ar": ["صحيح", "خطأ"]}


def _title_from_cover(cover_lines: list[str], keywords: list[str]) -> str | None:
    """Pick the cover line that best names the subject: short, not a date or a label,
    and sharing words with the document's keywords."""
    kw = {w for k in keywords for w in k.split()}
    best, best_score = None, 0.0
    for line in cover_lines:
        words = line.split()
        if not 2 <= len(words) <= 14 or len(line) > 120 or re.fullmatch(r"[\d\s/–-]+", line):
            continue
        tokens = {w.lower().strip(".,:;–-") for w in words}
        hits = len(tokens & kw)
        if not hits:
            continue
        score = hits + (0.5 if len(words) <= 8 else 0)
        if score > best_score:
            best, best_score = line.strip(" -–•"), score
    return best


def guess_title(text: str, metadata: dict, filename: str,
                cover_lines: list[str] | None = None, keywords: list[str] | None = None) -> str:
    lowered = {str(k).lower().lstrip("/"): v for k, v in (metadata or {}).items()}
    meta_title = str(lowered.get("title") or "").strip()
    if 3 <= len(meta_title) <= 150 and not meta_title.lower().endswith((".doc", ".docx",
                                                                        ".pdf", ".ppt")):
        return meta_title
    from_cover = _title_from_cover(cover_lines or [], keywords or [])
    if from_cover:
        return from_cover
    heading = first_heading(text)
    if heading and len(heading.split()) <= 12:
        return heading
    stem = re.sub(r"[_\-]+", " ", filename.rsplit(".", 1)[0]).strip()
    return stem.capitalize() or "Document sans titre"


def summarize(text: str, lang: str, sentences: int = 8) -> str:
    ranked = rank_sentences(text, lang, limit=sentences)
    if not ranked:
        return truncate(text, 900)
    half = (len(ranked) + 1) // 2
    return " ".join(ranked[:half]) + "\n\n" + " ".join(ranked[half:])


def key_points(text: str, lang: str, limit: int = 8) -> list[str]:
    return rank_sentences(text, lang, limit=limit, max_words=35)


STRONG_DEF = re.compile(r"\b(est|sont)\s+(donc\s+)?défini(e|s|es)?\b|\bdésigne|\bse définit"
                        r"|\bon (appelle|nomme)|\bcorrespond à|\brefers to|\bis defined", re.I)
# « X est donc la… » defines; « X est donc à retenir / est de décrire / est dû » does not
COPULA_TAIL = re.compile(r"\b(est|sont|is|are)\s+(?:donc\s+|ainsi\s+|alors\s+)?(?P<next>[\w'’]+)",
                         re.I)
DEFINING_NEXT = {"le", "la", "les", "l", "un", "une", "des", "l'", "l’", "constitué", "constituée",
                 "composé", "composée", "formé", "formée", "appelé", "appelée", "a", "an", "the"}
DISCURSIVE = re.compile(r"\b(ici|nous|vous|je|cours|chapitre|diapo)\b", re.I)


def _definition_score(sentence: str) -> int:
    if STRONG_DEF.search(sentence):
        return 3
    m = COPULA_TAIL.search(sentence)
    if m:
        nxt = m.group("next").lower()
        nxt = "l" if nxt.startswith(("l'", "l’")) else nxt
        return 2 if nxt in DEFINING_NEXT else 0
    return 1  # « Terme : définition » form


def glossary(text: str, limit: int = 15) -> list[dict]:
    """Definitions found in the text; when a term is defined twice the clearest one wins."""
    best: dict[str, tuple[int, int, str, str]] = {}  # key → (score, order, term, sentence)
    for order, sentence in enumerate(split_sentences(text)):
        sentence = sentence.strip()
        if is_noise_sentence(sentence) or DISCURSIVE.search(sentence):
            continue
        for pattern in DEFINITION_PATTERNS:
            m = pattern.match(sentence)
            if not m:
                continue
            term = LEADING_ARTICLE.sub("", m.group("term").strip(" ,:;'’").strip())
            if len(m.group("def").split()) < 5 or not (2 <= len(term) <= 60) \
                    or len(term.split()) > 5 or HEADING_WORDS.match(term) or not _good_term(term):
                continue
            score = _definition_score(sentence)
            key = term.lower()
            if score and (key not in best or score > best[key][0]):
                best[key] = (score, best.get(key, (0, order))[1], term, sentence)
            break
    ranked = sorted(best.values(), key=lambda x: (-x[0], x[1]))[:limit]
    return [{"term": t[:1].upper() + t[1:], "definition": s}
            for _, _, t, s in sorted(ranked, key=lambda x: x[1])]


def faq(gloss: list[dict], points: list[str], lang: str) -> list[dict]:
    q_tpl = {"fr": "Que désigne « {t} » ?", "en": "What does “{t}” mean?",
             "ar": "ماذا يعني «{t}»؟"}
    items = [{"question": q_tpl.get(lang, q_tpl["fr"]).format(t=g["term"].lower()),
              "answer": g["definition"]} for g in gloss[:8]]
    if len(items) < 4:
        label = {"fr": "Que faut-il retenir ?", "en": "What should I remember?",
                 "ar": "ماذا يجب أن أتذكر؟"}.get(lang, "Que faut-il retenir ?")
        items.append({"question": label, "answer": " ".join(points[:3])})
    return items


def explanation(summary: str, points: list[str], gloss: list[dict], lang: str) -> str:
    h = {"fr": ("L'idée générale", "Les notions clés", "À retenir"),
         "en": ("The big picture", "Key notions", "Remember")}.get(
        lang, ("L'idée générale", "Les notions clés", "À retenir"))
    notions = "\n".join(f"- **{g['term']}** — {g['definition']}" for g in gloss[:8]) or \
        "\n".join(f"- {p}" for p in points[:5])
    remember = "\n".join(f"- {p}" for p in points[:6])
    return (f"## {h[0]}\n\n{summary}\n\n## {h[1]}\n\n{notions}\n\n## {h[2]}\n\n{remember}\n\n"
            "_Explication extraite automatiquement : lancez Ollama pour une explication "
            "rédigée par l'IA._")


def answer_from_passages(passages: list[ScoredChunk], lang: str) -> str:
    intro = {"fr": "Voici les passages du document les plus pertinents pour votre question :",
             "en": "Here are the most relevant passages from the document:",
             "ar": "هذه أهم المقاطع من المستند المتعلقة بسؤالك:"}.get(lang)
    lines = [intro, ""]
    for i, p in enumerate(passages[:3], start=1):
        lines.append(f"> {truncate(p.text, 420)} [{i}]")
        lines.append("")
    return "\n".join(lines).strip()


def quiz_questions(passages: list[ScoredChunk], n: int, lang: str, kinds: list[str],
                   seed: int | None = None) -> list[QuestionDraft]:
    """Cloze MCQs (hide a keyword, distractors from other keywords) and true/false
    questions (true = original sentence, false = keyword swapped)."""
    rng = random.Random(seed)
    corpus = " ".join(p.text for p in passages)
    vocab = [k for k in extract_keywords(corpus, lang, limit=40) if " " not in k]
    blank = {"fr": "Complétez : ", "en": "Fill in the blank: "}.get(lang, "Complétez : ")
    tf_q = {"fr": "Vrai ou faux : ", "en": "True or false: "}.get(lang, "Vrai ou faux : ")
    tf = TF_LABELS.get(lang, TF_LABELS["fr"])

    drafts: list[QuestionDraft] = []
    sentences = []
    for p in passages:
        for s in split_sentences(p.text):
            if 8 <= len(s.split()) <= 40:
                sentences.append((s, p.page_start))
    rng.shuffle(sentences)

    for sentence, page in sentences:
        if len(drafts) >= n:
            break
        present = [k for k in vocab if re.search(rf"\b{re.escape(k)}\b", sentence, re.I)]
        if not present:
            continue
        answer = max(present, key=len)
        others = [k for k in vocab if k.lower() != answer.lower()]
        kind = kinds[len(drafts) % len(kinds)]
        if kind == "true_false" and others:
            make_false = rng.random() < 0.5
            stmt = sentence
            if make_false:
                stmt = re.sub(rf"\b{re.escape(answer)}\b", rng.choice(others), sentence,
                              count=1, flags=re.I)
            drafts.append(QuestionDraft(
                kind="true_false", prompt=tf_q + stmt, choices=list(tf),
                answer_index=1 if make_false else 0,
                explanation=f"Le document indique : « {sentence} »", page=page))
        elif len(others) >= 3:
            distractors = rng.sample(others, 3)
            choices = distractors + [answer]
            rng.shuffle(choices)
            prompt = re.sub(rf"\b{re.escape(answer)}\b", "_____", sentence, count=1, flags=re.I)
            drafts.append(QuestionDraft(
                kind="mcq", prompt=blank + prompt, choices=choices,
                answer_index=choices.index(answer),
                explanation=f"Le document indique : « {sentence} »", page=page))
    return drafts


def flashcards(gloss: list[dict], points: list[str], n: int) -> list[FlashcardDraft]:
    cards = [FlashcardDraft(front=g["term"], back=g["definition"]) for g in gloss]
    for p in points:
        if len(cards) >= n:
            break
        words = p.split()
        cut = max(4, len(words) // 2)
        cards.append(FlashcardDraft(front=" ".join(words[:cut]) + " …", back=p))
    return cards[:n]
