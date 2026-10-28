import pytest
from django.utils import timezone

pytestmark = pytest.mark.django_db


def test_dashboard_reflects_activity(api, ready_document):
    api.post("/api/v1/planner/sessions/", {"minutes": 25, "started_at": timezone.now().isoformat()},
             format="json")
    data = api.get("/api/v1/analytics/dashboard/").data
    assert data["documents"]["ready"] == 1
    assert data["streak"]["current"] == 1 and data["streak"]["active_today"]
    assert data["goal"]["today_minutes"] == 25
    assert len(data["week"]) == 7
    assert any(b["code"] == "first_document" and b["earned"] for b in data["badges"])


def test_activity_series_and_progress(api, ready_document):
    series = api.get("/api/v1/analytics/activity/", {"days": 30}).data
    assert len(series) == 30 and series[-1]["date"] == timezone.localdate().isoformat()
    progress = api.get("/api/v1/analytics/progress/").data
    assert progress[0]["id"] == ready_document.pk and progress[0]["mastery"] == 0


def test_global_search(api, ready_document):
    res = api.get("/api/v1/analytics/search/", {"q": "données"}).data
    assert res["documents"][0]["id"] == ready_document.pk
    assert api.get("/api/v1/analytics/search/", {"q": "a"}).status_code == 400
