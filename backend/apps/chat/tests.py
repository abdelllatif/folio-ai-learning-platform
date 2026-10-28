import pytest

pytestmark = pytest.mark.django_db


def _conversation(api, document):
    res = api.post("/api/v1/conversations/", {"document": document.pk}, format="json")
    assert res.status_code == 201, res.data
    return res.data["id"]


def test_ask_returns_grounded_answer_with_citations(api, ready_document):
    conv = _conversation(api, ready_document)
    res = api.post(f"/api/v1/conversations/{conv}/ask/",
                   {"content": "Qu'est-ce qu'une clé étrangère ?"}, format="json")
    assert res.status_code == 201
    answer = res.data["answer"]
    assert answer["grounded"] and answer["citations"]
    assert answer["citations"][0]["page_start"] >= 1
    detail = api.get(f"/api/v1/conversations/{conv}/").data
    assert len(detail["messages"]) == 2
    assert detail["title"].startswith("Qu'est-ce")


def test_off_topic_question_is_refused(api, ready_document):
    conv = _conversation(api, ready_document)
    res = api.post(f"/api/v1/conversations/{conv}/ask/",
                   {"content": "Qui a gagné la coupe du monde de football ?"}, format="json")
    assert res.data["answer"]["grounded"] is False
    assert res.data["answer"]["citations"] == []


def test_conversations_filtered_by_document_and_export(api, ready_document):
    conv = _conversation(api, ready_document)
    api.post(f"/api/v1/conversations/{conv}/ask/", {"content": "transaction"}, format="json")
    listed = api.get("/api/v1/conversations/", {"document": ready_document.pk}).data
    assert listed["count"] == 1 and listed["results"][0]["message_count"] == 2
    export = api.get(f"/api/v1/conversations/{conv}/export/")
    assert export.status_code == 200 and b"Folio" in export.content


def test_feedback(api, ready_document):
    conv = _conversation(api, ready_document)
    answer = api.post(f"/api/v1/conversations/{conv}/ask/", {"content": "index"},
                      format="json").data["answer"]
    res = api.post(f"/api/v1/messages/{answer['id']}/feedback/", {"value": 1}, format="json")
    assert res.data["feedback"] == 1
