import pytest

from .models import Choice

pytestmark = pytest.mark.django_db


def _generate(api, document, **extra):
    res = api.post("/api/v1/quizzes/generate/",
                   {"document": document.pk, "count": 4, **extra}, format="json")
    assert res.status_code == 201, res.data
    return res.data


def test_generated_quiz_hides_answers(api, ready_document):
    quiz = _generate(api, ready_document)
    assert quiz["questions"]
    for q in quiz["questions"]:
        assert all(set(c) == {"id", "text"} for c in q["choices"])


def test_submit_scores_and_reviews(api, ready_document):
    quiz = _generate(api, ready_document)
    answers = {}
    for i, q in enumerate(quiz["questions"]):
        correct = Choice.objects.get(question_id=q["id"], is_correct=True)
        answers[str(q["id"])] = correct.id if i == 0 else None  # 1 right, rest skipped
    res = api.post(f"/api/v1/quizzes/{quiz['id']}/submit/",
                   {"answers": answers, "duration_seconds": 42}, format="json")
    assert res.status_code == 201
    assert res.data["score"] == 1 and res.data["total"] == len(quiz["questions"])
    assert res.data["answers"][0]["correct_choice"]

    mistakes = api.get(f"/api/v1/quizzes/{quiz['id']}/mistakes/").data
    assert len(mistakes) == len(quiz["questions"]) - 1

    retry = {str(m["id"]): Choice.objects.get(question_id=m["id"], is_correct=True).id
             for m in mistakes}
    res = api.post(f"/api/v1/quizzes/{quiz['id']}/submit/",
                   {"answers": retry, "mode": "mistakes"}, format="json")
    assert res.data["percent"] == 100.0

    history = api.get("/api/v1/attempts/", {"quiz": quiz["id"]}).data
    assert history["count"] == 2
    listed = api.get("/api/v1/quizzes/").data["results"][0]
    assert listed["attempt_count"] == 2 and listed["best_percent"] == 100.0


def test_focus_not_in_document(api, ready_document):
    res = api.post("/api/v1/quizzes/generate/",
                   {"document": ready_document.pk, "focus": "mitochondrie photosynthèse"},
                   format="json")
    assert res.status_code == 400
    assert res.data["error"]["code"] == "focus_not_found"


def test_rejects_foreign_question(api, ready_document):
    quiz = _generate(api, ready_document)
    res = api.post(f"/api/v1/quizzes/{quiz['id']}/submit/", {"answers": {"999999": None}},
                   format="json")
    assert res.status_code == 400
