"""Shared fixtures for Django app tests."""
import pytest
from rest_framework.test import APIClient

from ai.tests.conftest import COURSE


@pytest.fixture
def user(django_user_model):
    return django_user_model.objects.create_user(
        email="amine@example.com", password="Etudiant-2026", first_name="Amine")


@pytest.fixture
def other_user(django_user_model):
    return django_user_model.objects.create_user(
        email="lina@example.com", password="Etudiant-2026", first_name="Lina")


@pytest.fixture
def api(user):
    client = APIClient()
    client.force_authenticate(user)
    return client


def make_pdf_bytes(paragraphs: list[str]) -> bytes:
    from io import BytesIO
    import textwrap

    from reportlab.lib.pagesizes import A4
    from reportlab.pdfgen import canvas

    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    c.setTitle("Introduction aux bases de données")
    y = 800
    for para in paragraphs:
        for line in textwrap.wrap(para, 90) + [""]:
            if y < 60:
                c.showPage()
                y = 800
            c.drawString(50, y, line)
            y -= 16
    c.save()
    return buf.getvalue()


@pytest.fixture
def course_pdf():
    from django.core.files.uploadedfile import SimpleUploadedFile

    pytest.importorskip("reportlab")
    paragraphs = [p for p in COURSE.split("\n") if p.strip()] * 3
    return SimpleUploadedFile("bases_de_donnees.pdf", make_pdf_bytes(paragraphs),
                              content_type="application/pdf")


@pytest.fixture
def ready_document(api, course_pdf, django_capture_on_commit_callbacks):
    with django_capture_on_commit_callbacks(execute=True):
        res = api.post("/api/v1/documents/", {"file": course_pdf}, format="multipart")
    from apps.documents.models import Document

    return Document.objects.get(pk=res.data["id"])
