"""Dense retrieval with a small lexical boost and diversity (MMR)."""
import numpy as np

from .textproc import words
from .types import ScoredChunk


def _lexical_overlap(query: str, text: str) -> float:
    q = {w.lower() for w in words(query) if len(w) > 3}
    if not q:
        return 0.0
    t = {w.lower() for w in words(text)}
    return len(q & t) / len(q)


def search(query_vec: np.ndarray, matrix: np.ndarray, items: list[dict], query: str,
           top_k: int = 5, min_score: float = 0.25, lexical_weight: float = 0.15,
           diversity: float = 0.3) -> list[ScoredChunk]:
    """Rank ``items`` (dicts with ref/text/page_start/page_end) against the query.

    ``matrix`` rows are L2-normalised embeddings aligned with ``items``.
    """
    if matrix.size == 0 or not items:
        return []
    dense = matrix @ query_vec
    lexical = np.array([_lexical_overlap(query, it["text"]) for it in items])
    scores = (1 - lexical_weight) * dense + lexical_weight * lexical

    candidates = [i for i in np.argsort(-scores)[: top_k * 4] if scores[i] >= min_score]
    selected: list[int] = []
    # Maximal Marginal Relevance: avoid returning five near-identical overlapping chunks
    while candidates and len(selected) < top_k:
        if not selected:
            best = candidates[0]
        else:
            sel = matrix[selected]

            def mmr(i):
                return (1 - diversity) * scores[i] - diversity * float(np.max(sel @ matrix[i]))

            best = max(candidates, key=mmr)
        selected.append(best)
        candidates.remove(best)

    return [ScoredChunk(ref=items[i]["ref"], text=items[i]["text"],
                        page_start=items[i]["page_start"], page_end=items[i]["page_end"],
                        score=float(scores[i])) for i in selected]
