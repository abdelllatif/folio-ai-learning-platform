from uuid import uuid4

from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel


def upload_path(instance, filename):
    return f"documents/{instance.owner_id}/{uuid4().hex}.pdf"


class Subject(TimeStampedModel):
    """A course / folder the student uses to organise their library (« matière »)."""

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                              related_name="subjects")
    name = models.CharField(max_length=80)
    color = models.CharField(max_length=7, default="#24408E")
    icon = models.CharField(max_length=30, default="book")

    class Meta:
        ordering = ("name",)
        constraints = [models.UniqueConstraint(fields=("owner", "name"),
                                               name="unique_subject_per_owner")]

    def __str__(self):
        return self.name


class Document(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = "pending", "En attente"
        PROCESSING = "processing", "En cours d'analyse"
        READY = "ready", "Prêt"
        FAILED = "failed", "Échec"

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                              related_name="documents")
    subject = models.ForeignKey(Subject, on_delete=models.SET_NULL, null=True, blank=True,
                                related_name="documents")
    file = models.FileField(upload_to=upload_path)
    original_filename = models.CharField(max_length=255)
    file_size = models.PositiveIntegerField(default=0)

    # processing state
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.PENDING,
                              db_index=True)
    progress = models.PositiveSmallIntegerField(default=0)
    status_message = models.CharField(max_length=160, blank=True)
    error = models.TextField(blank=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    generated_by = models.CharField(max_length=12, blank=True)  # llm | extractive

    # extracted facts
    title = models.CharField(max_length=200, blank=True)
    page_count = models.PositiveIntegerField(default=0)
    word_count = models.PositiveIntegerField(default=0)
    reading_minutes = models.PositiveIntegerField(default=0)
    language = models.CharField(max_length=5, blank=True)
    ocr_pages = models.PositiveIntegerField(default=0)
    pdf_metadata = models.JSONField(default=dict, blank=True)

    # generated study material
    short_summary = models.TextField(blank=True)
    summary = models.TextField(blank=True)
    explanation = models.TextField(blank=True)
    key_points = models.JSONField(default=list, blank=True)
    keywords = models.JSONField(default=list, blank=True)
    glossary = models.JSONField(default=list, blank=True)
    faq = models.JSONField(default=list, blank=True)
    ai_subject = models.CharField(max_length=80, blank=True)
    ai_level = models.CharField(max_length=40, blank=True)
    category = models.CharField(max_length=20, blank=True)

    # student-side state
    is_favorite = models.BooleanField(default=False)
    last_opened_at = models.DateTimeField(null=True, blank=True)
    last_page = models.PositiveIntegerField(default=1)

    class Meta(TimeStampedModel.Meta):
        indexes = [models.Index(fields=("owner", "status")),
                   models.Index(fields=("owner", "-last_opened_at"))]

    def __str__(self):
        return self.title or self.original_filename

    @property
    def is_ready(self) -> bool:
        return self.status == self.Status.READY


class DocumentPage(models.Model):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name="pages")
    number = models.PositiveIntegerField()
    text = models.TextField(blank=True)
    ocr_used = models.BooleanField(default=False)

    class Meta:
        ordering = ("number",)
        constraints = [models.UniqueConstraint(fields=("document", "number"),
                                               name="unique_page_number")]


class DocumentChunk(models.Model):
    """Retrieval unit for RAG. ``embedding`` stores a float32 vector as raw bytes."""

    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name="chunks")
    index = models.PositiveIntegerField()
    text = models.TextField()
    page_start = models.PositiveIntegerField()
    page_end = models.PositiveIntegerField()
    embedding = models.BinaryField()

    class Meta:
        ordering = ("index",)
        constraints = [models.UniqueConstraint(fields=("document", "index"),
                                               name="unique_chunk_index")]
