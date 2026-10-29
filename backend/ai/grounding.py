"""Check LLM study aids against the document they claim to come from.

The model is asked to define terms "from the document", but a small model happily
falls back on textbook definitions. ``ground_glossary`` keeps only terms the course
actually uses, attaches the sentence showing how the course uses each one, and flags
definitions whose content is not supported by those sentences (``in_course``).
"""
import re
import unicodedata

from .textproc import ELISION, _stop, split_sentences, truncate, words

STEM = 6  # compare on 6-letter stems: géologique ≈ géologie, plissement ≈ plissé
SUPPORT_RATIO = 0.5
EXCERPT_CHARS = 280


def _fold(text: str) -> str:
    """Lowercase without accents, so « Orogenèse » matches « orogenese »."""
    decomposed = unicodedata.normalize("NFD", text.lower())
    return "".join(c for c in decomposed if not unicodedata.combining(c))


def _term_pattern(term: str) -> re.Pattern | None:
    """Whole-word match tolerant to plurals: pli/plis, granite/granites, gneiss, réseau/réseaux."""
    parts = []
    for word in _fold(term).split():
        word = re.sub(r"[^\w'’-]", "", word)
        if not word:
            continue
        base = re.sub(r"(?<=\w{3})[sx]$", "", word)  # « granites » from the LLM → granite
        parts.append(re.escape(base) + r"[sx]?")
    if not parts:
        return None
    return re.compile(r"(?<!\w)" + r"\s+".join(parts) + r"(?!\w)")


def _stems(text: str, exclude: set[str] = frozenset()) -> set[str]:
    stop = _stop("fr")
    out = set()
    for w in words(text):
        w = ELISION.sub("", w.lower()).strip("'’-")
        if len(w) > 3 and w not in stop and not w.isdigit():
            stem = _fold(w)[:STEM]
            if stem not in exclude:
                out.add(stem)
    return out


def ground_glossary(items: list, document_text: str) -> list[dict]:
    """Drop terms absent from the document; add ``excerpt`` and ``in_course`` to the rest."""
    sentences = split_sentences(document_text)
    folded = [_fold(s) for s in sentences]
    grounded = []
    for item in items:
        if not isinstance(item, dict) or not item.get("term") or not item.get("definition"):
            continue
        term, definition = str(item["term"]).strip(), str(item["definition"]).strip()
        pattern = _term_pattern(term)
        mentions = [i for i, s in enumerate(folded) if pattern and pattern.search(s)]
        if not mentions:
            continue
        # the term's own words trivially occur in its sentences: judge only what is said about it
        claims = _stems(definition, exclude=_stems(term))
        sentence_stems = {i: _stems(sentences[i]) for i in mentions}
        supported = set().union(*sentence_stems.values())
        best = max(mentions, key=lambda i: (len(claims & sentence_stems[i]), -i))
        in_course = not claims or len(claims & supported) / len(claims) >= SUPPORT_RATIO
        grounded.append({"term": term, "definition": definition,
                         "excerpt": truncate(sentences[best], EXCERPT_CHARS),
                         "in_course": in_course})
    return grounded
