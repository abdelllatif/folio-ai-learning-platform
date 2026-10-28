from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel
from apps.documents.models import Document, Subject


class Exam(TimeStampedModel):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                              related_name="exams")
    title = models.CharField(max_length=160)
    subject = models.ForeignKey(Subject, on_delete=models.SET_NULL, null=True, blank=True)
    date = models.DateField()
    location = models.CharField(max_length=160, blank=True)
    documents = models.ManyToManyField(Document, blank=True, related_name="exams")
    daily_minutes = models.PositiveSmallIntegerField(default=60)

    class Meta:
        ordering = ("date",)


class StudyTask(TimeStampedModel):
    class Priority(models.TextChoices):
        LOW = "low", "Basse"
        NORMAL = "normal", "Normale"
        HIGH = "high", "Haute"

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                              related_name="tasks")
    title = models.CharField(max_length=200)
    due_date = models.DateField(null=True, blank=True)
    priority = models.CharField(max_length=6, choices=Priority.choices,
                                default=Priority.NORMAL)
    document = models.ForeignKey(Document, on_delete=models.SET_NULL, null=True, blank=True)
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, null=True, blank=True,
                             related_name="tasks")
    is_done = models.BooleanField(default=False)
    done_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("is_done", "due_date", "-created_at")


class StudySession(models.Model):
    """A block of focused study time, logged by the Pomodoro timer or a reading session."""

    class Kind(models.TextChoices):
        POMODORO = "pomodoro", "Pomodoro"
        READING = "reading", "Lecture"
        QUIZ = "quiz", "Quiz"
        FLASHCARDS = "flashcards", "Fiches"
        CHAT = "chat", "Assistant"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                             related_name="study_sessions")
    kind = models.CharField(max_length=12, choices=Kind.choices, default=Kind.POMODORO)
    document = models.ForeignKey(Document, on_delete=models.SET_NULL, null=True, blank=True)
    minutes = models.PositiveSmallIntegerField()
    started_at = models.DateTimeField(db_index=True)

    class Meta:
        ordering = ("-started_at",)
