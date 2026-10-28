from django.db import transaction
from django.utils import timezone

from apps.core.ai import get_ai
from apps.core.exceptions import DocumentNotReady, DomainError
from apps.documents.selectors import representative_passages

from .models import Card, CardReview, Deck
from .sm2 import review as sm2_review


def generate_deck(user, document, count: int = 20) -> Deck:
    if not document.is_ready:
        raise DocumentNotReady()
    drafts, source = get_ai().study.generate_flashcards(
        representative_passages(document), n=count, lang=document.language or "fr",
        glossary=document.glossary, key_points=document.key_points)
    if not drafts:
        raise DomainError("Impossible de créer des fiches à partir de ce document.",
                          code="flashcards_generation_failed")
    with transaction.atomic():
        deck = Deck.objects.create(owner=user, document=document,
                                   title=f"Fiches — {document.title}"[:200], generated_by=source)
        Card.objects.bulk_create([Card(deck=deck, front=d.front, back=d.back, page=d.page)
                                  for d in drafts])
    return deck


def review_card(user, card: Card, grade: int) -> Card:
    now = timezone.now()
    try:
        s = sm2_review(card.ease, card.interval_days, card.repetitions, card.lapses, grade, now)
    except ValueError as exc:
        raise DomainError("Note invalide.", code="invalid_grade") from exc
    card.ease, card.interval_days, card.repetitions = s.ease, s.interval_days, s.repetitions
    card.lapses, card.due_at, card.last_reviewed_at = s.lapses, s.due_at, now
    card.save(update_fields=["ease", "interval_days", "repetitions", "lapses", "due_at",
                             "last_reviewed_at", "updated_at"])
    CardReview.objects.create(card=card, user=user, grade=grade)
    return card
