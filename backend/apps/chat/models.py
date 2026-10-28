from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel
from apps.documents.models import Document


class Conversation(TimeStampedModel):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                              related_name="conversations")
    document = models.ForeignKey(Document, on_delete=models.CASCADE,
                                 related_name="conversations")
    title = models.CharField(max_length=160, default="Nouvelle conversation")
    is_pinned = models.BooleanField(default=False)

    class Meta:
        ordering = ("-is_pinned", "-updated_at")

    def __str__(self):
        return self.title


class Message(models.Model):
    class Role(models.TextChoices):
        USER = "user", "Étudiant"
        ASSISTANT = "assistant", "Folio"

    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE,
                                     related_name="messages")
    role = models.CharField(max_length=10, choices=Role.choices)
    content = models.TextField()
    citations = models.JSONField(default=list, blank=True)
    follow_ups = models.JSONField(default=list, blank=True)
    grounded = models.BooleanField(default=True)
    generated_by = models.CharField(max_length=12, blank=True)
    feedback = models.SmallIntegerField(null=True, blank=True)  # 1 helpful, -1 not helpful
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("created_at", "id")
