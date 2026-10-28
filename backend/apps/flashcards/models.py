from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.core.models import TimeStampedModel
from apps.documents.models import Document

MASTERED_INTERVAL_DAYS = 21


class Deck(TimeStampedModel):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                              related_name="decks")
    document = models.ForeignKey(Document, on_delete=models.SET_NULL, null=True, blank=True,
                                 related_name="decks")
    title = models.CharField(max_length=200)
    description = models.CharField(max_length=300, blank=True)
    generated_by = models.CharField(max_length=12, blank=True)

    def __str__(self):
        return self.title


class Card(TimeStampedModel):
    deck = models.ForeignKey(Deck, on_delete=models.CASCADE, related_name="cards")
    front = models.TextField()
    back = models.TextField()
    page = models.PositiveIntegerField(null=True, blank=True)

    # SM-2 state
    ease = models.FloatField(default=2.5)
    interval_days = models.PositiveIntegerField(default=0)
    repetitions = models.PositiveIntegerField(default=0)
    lapses = models.PositiveIntegerField(default=0)
    due_at = models.DateTimeField(default=timezone.now, db_index=True)
    last_reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("due_at", "id")

    @property
    def is_mastered(self) -> bool:
        return self.interval_days >= MASTERED_INTERVAL_DAYS


class CardReview(models.Model):
    card = models.ForeignKey(Card, on_delete=models.CASCADE, related_name="reviews")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                             related_name="card_reviews")
    grade = models.PositiveSmallIntegerField()
    reviewed_at = models.DateTimeField(auto_now_add=True, db_index=True)
