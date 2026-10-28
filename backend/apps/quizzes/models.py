from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel
from apps.documents.models import Document


class Quiz(TimeStampedModel):
    class Difficulty(models.TextChoices):
        EASY = "facile", "Facile"
        MEDIUM = "moyen", "Moyen"
        HARD = "difficile", "Difficile"

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                              related_name="quizzes")
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name="quizzes")
    title = models.CharField(max_length=200)
    difficulty = models.CharField(max_length=10, choices=Difficulty.choices,
                                  default=Difficulty.MEDIUM)
    focus = models.CharField(max_length=160, blank=True)
    time_limit_minutes = models.PositiveSmallIntegerField(null=True, blank=True)
    generated_by = models.CharField(max_length=12, blank=True)

    def __str__(self):
        return self.title


class Question(models.Model):
    class Kind(models.TextChoices):
        MCQ = "mcq", "Choix multiple"
        TRUE_FALSE = "true_false", "Vrai / Faux"

    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="questions")
    order = models.PositiveSmallIntegerField()
    kind = models.CharField(max_length=12, choices=Kind.choices)
    prompt = models.TextField()
    explanation = models.TextField(blank=True)
    page = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        ordering = ("order",)


class Choice(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name="choices")
    order = models.PositiveSmallIntegerField()
    text = models.CharField(max_length=500)
    is_correct = models.BooleanField(default=False)

    class Meta:
        ordering = ("order",)


class QuizAttempt(models.Model):
    class Mode(models.TextChoices):
        FULL = "full", "Quiz complet"
        MISTAKES = "mistakes", "Revoir mes erreurs"

    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="attempts")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                             related_name="quiz_attempts")
    mode = models.CharField(max_length=10, choices=Mode.choices, default=Mode.FULL)
    score = models.PositiveSmallIntegerField(default=0)
    total = models.PositiveSmallIntegerField(default=0)
    percent = models.FloatField(default=0)
    duration_seconds = models.PositiveIntegerField(default=0)
    completed_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ("-completed_at",)


class AttemptAnswer(models.Model):
    attempt = models.ForeignKey(QuizAttempt, on_delete=models.CASCADE, related_name="answers")
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name="answers")
    choice = models.ForeignKey(Choice, on_delete=models.SET_NULL, null=True, blank=True)
    is_correct = models.BooleanField(default=False)
