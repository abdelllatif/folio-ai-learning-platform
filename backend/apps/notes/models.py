from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel
from apps.documents.models import Document


class Note(TimeStampedModel):
    """Personal note, optionally attached to a document page.

    ``quote`` keeps the passage the student saved (from a summary, an answer or a page)
    separate from their own words in ``content``.
    """

    class Color(models.TextChoices):
        PLAIN = "plain", "Neutre"
        YELLOW = "yellow", "Jaune"
        BLUE = "blue", "Bleu"
        GREEN = "green", "Vert"
        PINK = "pink", "Rose"

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                              related_name="notes")
    document = models.ForeignKey(Document, on_delete=models.SET_NULL, null=True, blank=True,
                                 related_name="notes")
    page = models.PositiveIntegerField(null=True, blank=True)
    title = models.CharField(max_length=200, blank=True)
    quote = models.TextField(blank=True)
    content = models.TextField(blank=True)
    color = models.CharField(max_length=10, choices=Color.choices, default=Color.PLAIN)
    tags = models.JSONField(default=list, blank=True)
    is_pinned = models.BooleanField(default=False)

    class Meta:
        ordering = ("-is_pinned", "-updated_at")
