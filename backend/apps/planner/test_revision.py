from datetime import date

from .revision import build_plan

TODAY = date(2026, 10, 28)
DOCS = [{"id": 1, "title": "SQL", "reading_minutes": 20},
        {"id": 2, "title": "Normalisation", "reading_minutes": 10},
        {"id": 3, "title": "Transactions", "reading_minutes": 15}]


def test_plan_covers_every_day_and_every_document():
    plan = build_plan(TODAY, date(2026, 11, 7), DOCS)
    assert len(plan) == 10 and plan[0]["date"] == "2026-10-28"
    read_docs = {i["document_id"] for d in plan for i in d["items"] if i["kind"] == "read"}
    assert read_docs == {1, 2, 3}
    assert any(i["kind"] == "quiz" for d in plan for i in d["items"])
    assert plan[-1]["items"][-1]["kind"] == "rest"


def test_short_notice_and_past_exam():
    assert build_plan(TODAY, TODAY, DOCS) == []
    plan = build_plan(TODAY, date(2026, 10, 29), DOCS)
    assert len(plan) == 1 and len([i for i in plan[0]["items"] if i["kind"] == "read"]) == 3


def test_no_documents_gives_free_review():
    plan = build_plan(TODAY, date(2026, 10, 31), [])
    assert [d["items"][0]["kind"] for d in plan] == ["review"] * 3
