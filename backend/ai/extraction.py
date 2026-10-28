"""PDF text extraction: PyMuPDF first, pdfplumber for layout-heavy pages, Tesseract OCR
for scanned pages. Each page records whether OCR was needed."""
from io import BytesIO
import logging

from .textproc import clean_text, strip_repeated_lines
from .types import ExtractedDocument, Page

logger = logging.getLogger("ai.extraction")
MIN_TEXT_CHARS = 40  # below this a page is considered image-only


class ExtractionError(Exception):
    pass


def _ocr_image(image, languages: str) -> str:
    try:
        import pytesseract
    except ImportError:
        logger.warning("pytesseract not installed: OCR skipped")
        return ""
    try:
        return pytesseract.image_to_string(image, lang=languages)
    except Exception as exc:  # tesseract binary or language pack missing
        logger.warning("OCR failed: %s", exc)
        return ""


def _extract_with_pymupdf(path: str, ocr: bool, langs: str):
    import fitz  # PyMuPDF

    pages: list[Page] = []
    with fitz.open(path) as doc:
        if doc.needs_pass:
            raise ExtractionError("Ce PDF est protégé par un mot de passe.")
        meta = {k: v for k, v in (doc.metadata or {}).items() if v}
        for i, page in enumerate(doc, start=1):
            text = page.get_text("text") or ""
            used_ocr = False
            if len(text.strip()) < MIN_TEXT_CHARS and ocr:
                from PIL import Image

                pix = page.get_pixmap(dpi=300)
                image = Image.open(BytesIO(pix.tobytes("png")))
                ocr_text = _ocr_image(image, langs)
                if len(ocr_text.strip()) > len(text.strip()):
                    text, used_ocr = ocr_text, True
            pages.append(Page(number=i, text=text, ocr_used=used_ocr))
    return pages, meta


def _extract_with_pdfplumber(path: str, ocr: bool, langs: str, only: set[int] | None = None):
    import pdfplumber

    pages: list[Page] = []
    with pdfplumber.open(path) as pdf:
        meta = {k: v for k, v in (pdf.metadata or {}).items() if isinstance(v, str) and v}
        for i, page in enumerate(pdf.pages, start=1):
            if only is not None and i not in only:
                continue
            text = page.extract_text(layout=False) or ""
            # tables are flattened row by row so they stay searchable
            for table in page.extract_tables() or []:
                rows = [" | ".join(c or "" for c in row) for row in table if row]
                if rows:
                    text += "\n\n" + "\n".join(rows)
            used_ocr = False
            if len(text.strip()) < MIN_TEXT_CHARS and ocr:
                image = page.to_image(resolution=300).original
                ocr_text = _ocr_image(image, langs)
                if len(ocr_text.strip()) > len(text.strip()):
                    text, used_ocr = ocr_text, True
            pages.append(Page(number=i, text=text, ocr_used=used_ocr))
    return pages, meta


def extract_pdf(path: str, ocr_enabled: bool = True, ocr_languages: str = "fra+eng") \
        -> ExtractedDocument:
    try:
        pages, meta = _extract_with_pymupdf(path, ocr_enabled, ocr_languages)
        # pdfplumber is better with tables / columns: retry pages PyMuPDF found thin
        thin = {p.number for p in pages if len(p.text.strip()) < MIN_TEXT_CHARS and not p.ocr_used}
        if thin:
            try:
                better, _ = _extract_with_pdfplumber(path, False, ocr_languages, only=thin)
                by_no = {p.number: p for p in better}
                pages = [by_no[p.number] if p.number in by_no
                         and len(by_no[p.number].text) > len(p.text) else p for p in pages]
            except ImportError:
                pass
    except ImportError:
        logger.info("PyMuPDF unavailable, using pdfplumber")
        try:
            pages, meta = _extract_with_pdfplumber(path, ocr_enabled, ocr_languages)
        except ImportError as exc:
            raise ExtractionError("Aucune bibliothèque PDF installée.") from exc
    except ExtractionError:
        raise
    except Exception as exc:
        raise ExtractionError(f"PDF illisible : {exc}") from exc

    if not pages:
        raise ExtractionError("Le PDF ne contient aucune page.")

    cleaned = strip_repeated_lines([p.text for p in pages])
    for page, text in zip(pages, cleaned):
        page.text = clean_text(text)

    if not any(p.text for p in pages):
        raise ExtractionError(
            "Aucun texte trouvé. Le PDF est peut-être scanné : activez l'OCR ou "
            "déposez une version texte."
        )
    return ExtractedDocument(pages=pages, metadata=meta)
