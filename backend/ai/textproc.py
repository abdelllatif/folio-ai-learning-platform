"""Text utilities: cleaning, language detection, sentences, keywords, statistics."""
from collections import Counter
import math
import re
import unicodedata

STOPWORDS = {
    "fr": set("""
        a à au aux avec ce ces cet cette dans de des du elle elles en et être est eux il ils
        je la le les leur leurs lui ma mais me même mes moi mon ne nos notre nous on ou où par
        pas pour qu que qui sa se ses son sont sur ta te tes toi ton tu un une vos votre vous
        c d j l n s t y été sera ont avait fait plus comme aussi ainsi donc car si tout tous
        toute toutes entre sans sous chez peut peuvent doit deux autre autres très bien cela
        celle celui ceux dont lors alors après avant encore puis chaque quand leurs dès
    """.split()),
    "en": set("""
        a an the and or but if of to in on at by for with from as is are was were be been
        being this that these those it its into than then so such not no can could should
        would will may might must have has had do does did which who whom whose what when
        where why how all any each other some more most also very there their they them we
        you your our he she his her i me my about over under between after before
    """.split()),
}
ARABIC_RE = re.compile(r"[؀-ۿ]")
ELISION = re.compile(r"^(?:qu|[dljnsctm])['’]", re.I)  # d'une → une, l'index → index
WORD_RE = re.compile(r"[A-Za-zÀ-ÖØ-öø-ÿ؀-ۿ][A-Za-zÀ-ÖØ-öø-ÿ؀-ۿ'’-]+")
SENTENCE_RE = re.compile(r"(?<=[.!?؟])\s+(?=[A-ZÀ-ÖØ-Þ0-9؀-ۿ«\"(])")


def normalize(text: str) -> str:
    return unicodedata.normalize("NFKC", text or "")


def clean_text(text: str) -> str:
    """Repair common PDF extraction artefacts without destroying paragraphs."""
    text = normalize(text).replace("­", "")  # soft hyphens
    text = re.sub(r"(\w)-\n(\w)", r"\1\2", text)  # words broken across lines
    text = re.sub(r"[ \t ]+", " ", text)
    text = re.sub(r" *\n *", "\n", text)
    # join lines that were wrapped mid-sentence, keep blank-line paragraph breaks
    text = re.sub(r"(?<![.!?:;\n])\n(?!\n|[-•●▪*]|\d+[.)])", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def strip_repeated_lines(pages: list[str], min_ratio: float = 0.6) -> list[str]:
    """Remove running headers/footers that appear on most pages (and page numbers)."""
    if len(pages) < 4:
        return pages
    counts: Counter[str] = Counter()
    for page in pages:
        lines = {ln.strip() for ln in page.splitlines()[:3] + page.splitlines()[-3:]}
        counts.update(ln for ln in lines if ln)
    threshold = max(3, int(len(pages) * min_ratio))
    repeated = {ln for ln, c in counts.items() if c >= threshold}
    page_no = re.compile(r"^(page\s*)?\d{1,4}(\s*/\s*\d{1,4})?$", re.I)
    cleaned = []
    for page in pages:
        kept = [ln for ln in page.splitlines()
                if ln.strip() not in repeated and not page_no.match(ln.strip())]
        cleaned.append("\n".join(kept))
    return cleaned


def detect_language(text: str) -> str:
    sample = text[:20000].lower()
    if not sample.strip():
        return "fr"
    if len(ARABIC_RE.findall(sample)) > len(sample) * 0.2:
        return "ar"
    words = WORD_RE.findall(sample)
    scores = {lang: sum(1 for w in words if w in sw) for lang, sw in STOPWORDS.items()}
    return max(scores, key=scores.get) if any(scores.values()) else "fr"


def words(text: str) -> list[str]:
    return WORD_RE.findall(text)


def word_count(text: str) -> int:
    return len(words(text))


def reading_time_minutes(text: str, wpm: int = 220) -> int:
    return max(1, math.ceil(word_count(text) / wpm))


def split_sentences(text: str) -> list[str]:
    parts = []
    for para in re.split(r"\n{2,}", text):
        para = para.replace("\n", " ").strip()
        if para:
            parts.extend(s.strip() for s in SENTENCE_RE.split(para) if s.strip())
    return parts


def _stop(lang: str) -> set[str]:
    return STOPWORDS.get(lang, set()) | STOPWORDS["fr"] | STOPWORDS["en"]


def keyword_scores(text: str, lang: str = "fr") -> Counter:
    stop = _stop(lang)
    tokens = [ELISION.sub("", w.lower()).strip("'’-") for w in words(text)]
    tokens = [t for t in tokens if len(t) > 3 and t not in stop and not t.isdigit()]
    counts = Counter(tokens)
    # bigrams that occur at least twice are usually domain terms ("base de données" → "base données")
    bigrams = Counter(f"{a} {b}" for a, b in zip(tokens, tokens[1:]))
    for bg, c in bigrams.items():
        if c >= 2:
            counts[bg] = c * 1.6
    return counts


def extract_keywords(text: str, lang: str = "fr", limit: int = 12) -> list[str]:
    ranked = [k for k, _ in keyword_scores(text, lang).most_common(limit * 3)]
    picked: list[str] = []
    for kw in ranked:
        if any(kw in p or p in kw for p in picked):
            continue
        picked.append(kw)
        if len(picked) == limit:
            break
    return picked


def rank_sentences(text: str, lang: str = "fr", limit: int = 6,
                   min_words: int = 6, max_words: int = 45) -> list[str]:
    """Classic frequency-based extractive ranking; keeps original order."""
    sentences = [s for s in split_sentences(text) if min_words <= len(s.split()) <= max_words]
    if not sentences:
        return []
    freq = keyword_scores(text, lang)
    top = max(freq.values()) if freq else 1
    stop = _stop(lang)

    def score(s: str) -> float:
        toks = [w.lower() for w in words(s) if w.lower() not in stop]
        return sum(freq.get(t, 0) / top for t in toks) / (len(toks) ** 0.5 or 1)

    best = sorted(range(len(sentences)), key=lambda i: score(sentences[i]), reverse=True)[:limit]
    return [sentences[i] for i in sorted(best)]


def first_heading(text: str) -> str | None:
    for line in text.splitlines()[:25]:
        line = line.strip(" #*-•\t")
        if 3 <= len(line.split()) <= 14 and not line.endswith((".", ",", ";")) \
                and len(line) < 120:
            return line
    return None


def truncate(text: str, limit: int) -> str:
    if len(text) <= limit:
        return text
    cut = text[:limit].rsplit(" ", 1)[0]
    return cut.rstrip(" ,;:") + "…"
