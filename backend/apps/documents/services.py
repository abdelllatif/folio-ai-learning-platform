"""Write-side use cases for documents: upload and the analysis pipeline."""
import logging

import numpy as np
from django.db import transaction
from django.utils import timezone

from ai.chunking import chunk_pages
from ai.extraction import ExtractionError, extract_pdf
from ai.textproc import reading_time_minutes, word_count
from apps.accounts.services import assert_can_upload
from apps.core.ai import get_ai
from apps.core.exceptions import DomainError
from apps.core.tasks import enqueue

from .models import Document, DocumentChunk, DocumentPage

logger = logging.getLogger("folio.documents")
PDF_MAGIC = b"%PDF-"


def _validate_pdf(uploaded_file) -> None:
    name = (uploaded_file.name or "").lower()
    head = uploaded_file.read(5)
    uploaded_file.seek(0)
    if not name.endswith(".pdf") or head != PDF_MAGIC:
        raise DomainError("Seuls les fichiers PDF sont acceptés.", code="invalid_file")


def upload_document(user, uploaded_file, subject=None) -> Document:
    _validate_pdf(uploaded_file)
    assert_can_upload(user, uploaded_file.size)
    document = Document.objects.create(
        owner=user, subject=subject, file=uploaded_file,
        original_filename=uploaded_file.name[:255], file_size=uploaded_file.size,
        title=uploaded_file.name.rsplit(".", 1)[0][:200],
        status_message="En file d'attente",
    )
    transaction.on_commit(lambda: enqueue(process_document, document.pk))
    return document


def request_reprocess(document: Document) -> Document:
    if document.status == Document.Status.PROCESSING:
        raise DomainError("Analyse déjà en cours.", code="already_processing")
    document.status, document.progress, document.error = Document.Status.PENDING, 0, ""
    document.status_message = "En file d'attente"
    document.save(update_fields=["status", "progress", "error", "status_message", "updated_at"])
    transaction.on_commit(lambda: enqueue(process_document, document.pk))
    return document


def _step(document: Document, progress: int, message: str) -> None:
    document.progress, document.status_message = progress, message
    document.save(update_fields=["progress", "status_message", "updated_at"])


def process_document(document_id: int) -> None:
    """Extract → clean → chunk → embed → analyse. Idempotent: re-running replaces outputs."""
    document = Document.objects.get(pk=document_id)
    ai = get_ai()
    cfg = ai.config
    document.status, document.progress = Document.Status.PROCESSING, 5
    document.status_message = "Lecture du PDF"
    document.save(update_fields=["status", "progress", "status_message", "updated_at"])

    try:
        extracted = extract_pdf(document.file.path, ocr_enabled=cfg["OCR_ENABLED"],
                                ocr_languages=cfg["OCR_LANGUAGES"])
        _step(document, 30, "Découpage du contenu")
        chunks = chunk_pages(extracted.pages, size=cfg["CHUNK_SIZE"],
                             overlap=cfg["CHUNK_OVERLAP"])

        _step(document, 45, "Indexation sémantique")
        vectors = ai.study.embed([c.text for c in chunks]).astype(np.float32)

        _step(document, 65, "Génération du résumé et des fiches")
        full_text = extracted.full_text
        analysis = ai.study.analyze(full_text, extracted.metadata, document.original_filename)

        with transaction.atomic():
            DocumentPage.objects.filter(document=document).delete()
            DocumentChunk.objects.filter(document=document).delete()
            DocumentPage.objects.bulk_create([
                DocumentPage(document=document, number=p.number, text=p.text,
                             ocr_used=p.ocr_used) for p in extracted.pages], batch_size=200)
            DocumentChunk.objects.bulk_create([
                DocumentChunk(document=document, index=c.index, text=c.text,
                              page_start=c.page_start, page_end=c.page_end,
                              embedding=vectors[i].tobytes()) for i, c in enumerate(chunks)],
                batch_size=200)

            document.title = analysis.title[:200]
            document.page_count = extracted.page_count
            document.word_count = word_count(full_text)
            document.reading_minutes = reading_time_minutes(full_text)
            document.language = analysis.language
            document.ocr_pages = extracted.ocr_pages
            document.pdf_metadata = {k: str(v)[:200] for k, v in extracted.metadata.items()}
            document.short_summary = analysis.short_summary
            document.summary = analysis.summary
            document.explanation = analysis.explanation
            document.key_points = analysis.key_points
            document.keywords = analysis.keywords
            document.glossary = analysis.glossary
            document.faq = analysis.faq
            document.ai_subject = analysis.subject
            document.ai_level = analysis.level
            document.category = analysis.category
            document.generated_by = analysis.generated_by
            document.status = Document.Status.READY
            document.progress, document.status_message, document.error = 100, "Prêt", ""
            document.processed_at = timezone.now()
            document.save()
    except ExtractionError as exc:
        _fail(document, str(exc))
    except Exception as exc:  # noqa: BLE001
        logger.exception("Processing failed for document %s", document_id)
        _fail(document, f"Erreur inattendue pendant l'analyse ({exc.__class__.__name__}).")


def _fail(document: Document, message: str) -> None:
    document.status, document.error = Document.Status.FAILED, message
    document.status_message = "Échec de l'analyse"
    document.save(update_fields=["status", "error", "status_message", "updated_at"])


def mark_opened(document: Document, page: int | None = None) -> Document:
    document.last_opened_at = timezone.now()
    fields = ["last_opened_at"]
    if page and 1 <= page <= max(document.page_count, 1):
        document.last_page = page
        fields.append("last_page")
    document.save(update_fields=fields)
    return document
