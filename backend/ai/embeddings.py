"""Embedding port + adapters.

* ``SentenceTransformerEmbedder`` — production (multilingual MiniLM by default, runs on
  PyTorch, loaded lazily on first use).
* ``HashingEmbedder`` — deterministic, dependency-free (numpy only). Used in tests/CI and
  as an automatic fallback when torch isn't installed.
"""
from hashlib import blake2b
import logging
import re
from typing import Protocol

import numpy as np

logger = logging.getLogger("ai.embeddings")


class Embedder(Protocol):
    name: str
    dim: int
    min_score: float  # similarity below which a passage is considered irrelevant

    def embed(self, texts: list[str]) -> np.ndarray: ...


def _normalize(matrix: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(matrix, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    return matrix / norms


class HashingEmbedder:
    min_score = 0.08

    def __init__(self, dim: int = 512):
        self.dim = dim
        self.name = f"hashing-{dim}"

    _token = re.compile(r"\w+", re.UNICODE)

    def _features(self, text: str):
        toks = [t.lower() for t in self._token.findall(text) if len(t) > 2]
        # light stemming: share features between "réseau"/"réseaux", "model"/"models"
        toks = [t[:-1] if t.endswith(("s", "x")) and len(t) > 4 else t for t in toks]
        yield from toks
        yield from (f"{a}_{b}" for a, b in zip(toks, toks[1:]))

    def embed(self, texts: list[str]) -> np.ndarray:
        out = np.zeros((len(texts), self.dim), dtype=np.float32)
        for row, text in enumerate(texts):
            for feat in self._features(text):
                h = int.from_bytes(blake2b(feat.encode(), digest_size=8).digest(), "little")
                out[row, h % self.dim] += 1.0 if (h >> 63) & 1 else -1.0
        return _normalize(out)


class SentenceTransformerEmbedder:
    min_score = 0.25

    def __init__(self, model_name: str):
        self.name = model_name
        self._model = None
        self.dim = 384

    def _load(self):
        if self._model is None:
            from sentence_transformers import SentenceTransformer

            logger.info("Loading embedding model %s", self.name)
            self._model = SentenceTransformer(self.name)
            self.dim = self._model.get_sentence_embedding_dimension()
        return self._model

    def embed(self, texts: list[str]) -> np.ndarray:
        if not texts:
            return np.zeros((0, self.dim), dtype=np.float32)
        vectors = self._load().encode(texts, batch_size=32, normalize_embeddings=True,
                                      show_progress_bar=False)
        return np.asarray(vectors, dtype=np.float32)


def build_embedder(model_name: str, light: bool = False) -> Embedder:
    if light:
        return HashingEmbedder()
    try:
        import sentence_transformers  # noqa: F401
    except ImportError:
        logger.warning("sentence-transformers missing — falling back to HashingEmbedder")
        return HashingEmbedder()
    return SentenceTransformerEmbedder(model_name)
