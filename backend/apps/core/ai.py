"""Composition root for the AI layer.

The framework-free ``ai`` package defines ports (Embedder, LLMClient) and adapters.
This module wires the concrete adapters from Django settings once per process, so
the rest of the Django code depends on ``get_ai()`` only — never on Ollama or torch.
"""
from dataclasses import dataclass
from functools import lru_cache

from django.conf import settings

from ai.embeddings import Embedder, build_embedder
from ai.llm import LLMClient, OllamaClient
from ai.service import StudyAI


@dataclass(frozen=True)
class AIContainer:
    llm: LLMClient
    embedder: Embedder
    study: StudyAI
    config: dict


@lru_cache(maxsize=1)
def get_ai() -> AIContainer:
    cfg = settings.FOLIO_AI
    llm = OllamaClient(
        base_url=cfg["OLLAMA_BASE_URL"],
        model=cfg["OLLAMA_MODEL"],
        timeout=cfg["OLLAMA_TIMEOUT"],
    )
    embedder = build_embedder(cfg["EMBEDDING_MODEL"], light=cfg["EMBEDDING_LIGHT"])
    study = StudyAI(llm=llm, embedder=embedder, top_k=cfg["RAG_TOP_K"],
                    min_score=cfg["RAG_MIN_SCORE"])
    return AIContainer(llm=llm, embedder=embedder, study=study, config=cfg)
