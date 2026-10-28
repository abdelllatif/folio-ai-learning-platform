from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel


class ContactMessage(TimeStampedModel):
    class Topic(models.TextChoices):
        QUESTION = "question", "Question"
        BUG = "bug", "Signaler un problème"
        FEATURE = "feature", "Suggestion"
        SCHOOL = "school", "Offre établissement"
        BILLING = "billing", "Facturation"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
                             blank=True)
    name = models.CharField(max_length=120)
    email = models.EmailField()
    topic = models.CharField(max_length=10, choices=Topic.choices, default=Topic.QUESTION)
    organization = models.CharField(max_length=160, blank=True)
    message = models.TextField(max_length=4000)
    is_handled = models.BooleanField(default=False)


class NewsletterSubscriber(TimeStampedModel):
    email = models.EmailField(unique=True)
    is_active = models.BooleanField(default=True)
