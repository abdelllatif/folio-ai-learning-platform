import pytest

from ai.extraction import ExtractionError, extract_pdf

reportlab = pytest.importorskip("reportlab")


def _make_pdf(path, pages):
    from reportlab.lib.pagesizes import A4
    from reportlab.pdfgen import canvas

    c = canvas.Canvas(str(path), pagesize=A4)
    c.setTitle("Cours de réseaux")
    for lines in pages:
        y = 800
        for line in lines:
            c.drawString(60, y, line)
            y -= 18
        c.showPage()
    c.save()


def test_extracts_text_per_page_and_metadata(tmp_path):
    pdf = tmp_path / "reseaux.pdf"
    _make_pdf(pdf, [["Le modèle OSI comporte sept couches.", "La couche physique transmet."],
                    ["Le protocole TCP assure une livraison fiable des segments."]])
    doc = extract_pdf(str(pdf), ocr_enabled=False)
    assert doc.page_count == 2
    assert "sept couches" in doc.pages[0].text
    assert "TCP" in doc.pages[1].text
    assert doc.metadata.get("title") == "Cours de réseaux" or doc.metadata.get("Title")


def test_blank_pdf_raises_helpful_error(tmp_path):
    pdf = tmp_path / "vide.pdf"
    _make_pdf(pdf, [[]])
    with pytest.raises(ExtractionError, match="Aucun texte"):
        extract_pdf(str(pdf), ocr_enabled=False)
