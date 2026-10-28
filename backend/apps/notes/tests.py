import pytest

pytestmark = pytest.mark.django_db


def test_note_crud_and_export(api, ready_document):
    res = api.post("/api/v1/notes/", {
        "document": ready_document.pk, "page": 1, "quote": "Une clé primaire identifie...",
        "content": "À revoir avant le partiel", "tags": ["SQL", "partiel", "sql"],
    }, format="json")
    assert res.status_code == 201, res.data
    assert res.data["tags"] == ["partiel", "sql"]
    assert api.get("/api/v1/notes/", {"document": ready_document.pk}).data["count"] == 1
    export = api.get("/api/v1/notes/export/")
    assert b"partiel" in export.content


def test_empty_note_rejected(api):
    assert api.post("/api/v1/notes/", {"title": ""}, format="json").status_code == 400


def test_cannot_attach_note_to_foreign_document(api, other_user):
    from apps.documents.models import Document

    foreign = Document.objects.create(owner=other_user, original_filename="x.pdf", file="x.pdf")
    res = api.post("/api/v1/notes/", {"document": foreign.pk, "content": "x"}, format="json")
    assert res.status_code == 400
