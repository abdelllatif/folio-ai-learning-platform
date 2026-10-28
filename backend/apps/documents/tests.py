import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings

from .models import Document

pytestmark = pytest.mark.django_db


def test_upload_runs_pipeline_and_builds_study_material(ready_document):
    doc = ready_document
    assert doc.status == Document.Status.READY, doc.error
    assert doc.page_count >= 1 and doc.chunks.count() > 0
    assert doc.summary and doc.key_points and doc.glossary
    assert doc.language == "fr" and doc.generated_by == "extractive"
    assert "bases de données" in doc.title.lower()


def test_rejects_non_pdf(api):
    fake = SimpleUploadedFile("notes.pdf", b"hello world", content_type="application/pdf")
    res = api.post("/api/v1/documents/", {"file": fake}, format="multipart")
    assert res.status_code == 400
    assert res.data["error"]["code"] == "invalid_file"


@override_settings(FOLIO_PLANS={"free": {"max_documents": 1, "max_file_mb": 25},
                                "pro": {"max_documents": None, "max_file_mb": 100}})
def test_free_plan_document_quota(api, ready_document, course_pdf):
    course_pdf.seek(0)
    res = api.post("/api/v1/documents/", {"file": course_pdf}, format="multipart")
    assert res.status_code == 402
    assert res.data["error"]["code"] == "quota_exceeded"


def test_documents_are_private(ready_document, other_user):
    from rest_framework.test import APIClient

    client = APIClient()
    client.force_authenticate(other_user)
    assert client.get(f"/api/v1/documents/{ready_document.pk}/").status_code == 404
    assert client.get("/api/v1/documents/").data["count"] == 0


def test_find_in_document_and_pages(api, ready_document):
    res = api.get(f"/api/v1/documents/{ready_document.pk}/find/", {"q": "clé primaire"})
    assert res.status_code == 200 and res.data["count"] >= 1
    assert res.data["results"][0]["page"] >= 1
    pages = api.get(f"/api/v1/documents/{ready_document.pk}/pages/")
    assert pages.data["count"] == ready_document.page_count


def test_subjects_and_filtering(api, ready_document):
    subject = api.post("/api/v1/subjects/", {"name": "Bases de données", "color": "#2F9E74"},
                       format="json").data
    api.patch(f"/api/v1/documents/{ready_document.pk}/", {"subject_id": subject["id"]},
              format="json")
    listed = api.get("/api/v1/documents/", {"subject": subject["id"]}).data
    assert listed["count"] == 1
    subjects = api.get("/api/v1/subjects/").data
    assert subjects[0]["document_count"] == 1
    dup = api.post("/api/v1/subjects/", {"name": "bases de données"}, format="json")
    assert dup.status_code == 400


def test_favorite_toggle_and_opened(api, ready_document):
    assert api.post(f"/api/v1/documents/{ready_document.pk}/favorite/").data["is_favorite"]
    res = api.post(f"/api/v1/documents/{ready_document.pk}/opened/", {"page": 1}, format="json")
    assert res.data["last_page"] == 1
