"""Read-side queries (kept apart from services that mutate state)."""
from functools import lru_cache

import numpy as np
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404

from apps.core.exceptions import DocumentNotReady

from .models import Document, DocumentChunk, Subject


def documents_for(user):
    return Document.objects.filter(owner=user).select_related("subject")


def subjects_for(user):
    return Subject.objects.filter(owner=user).annotate(
        document_count=Count("documents"),
        ready_count=Count("documents", filter=Q(documents__status=Document.Status.READY)),
    )


def get_ready_document(user, document_id) -> Document:
    document = get_object_or_404(Document, pk=document_id, owner=user)
    if not document.is_ready:
        raise DocumentNotReady()
    return document


@lru_cache(maxsize=64)
def _load_index(document_id: int, version: str):
    rows = list(DocumentChunk.objects.filter(document_id=document_id)
                .values_list("id", "text", "page_start", "page_end", "embedding"))
    if not rows:
        return np.zeros((0, 1), dtype=np.float32), []
    matrix = np.vstack([np.frombuffer(bytes(r[4]), dtype=np.float32) for r in rows])
    items = [{"ref": r[0], "text": r[1], "page_start": r[2], "page_end": r[3]} for r in rows]
    return matrix, items


def load_index(document: Document):
    """Embedding matrix + chunk metadata, cached per processed version of the document."""
    version = document.processed_at.isoformat() if document.processed_at else "0"
    return _load_index(document.pk, version)


def representative_passages(document: Document, limit: int = 14):
    """Evenly spread chunks across the document — used to seed quizzes/flashcards so they
    cover the whole course, not just its introduction."""
    from ai.types import ScoredChunk

    _, items = load_index(document)
    if not items:
        return []
    step = max(1, len(items) // limit)
    picked = items[::step][:limit]
    return [ScoredChunk(ref=i["ref"], text=i["text"], page_start=i["page_start"],
                        page_end=i["page_end"], score=1.0) for i in picked]
