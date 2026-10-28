from datetime import timedelta

import pytest
from django.utils import timezone

pytestmark = pytest.mark.django_db


def test_exam_plan_and_tasks(api, ready_document):
    exam_date = (timezone.localdate() + timedelta(days=6)).isoformat()
    exam = api.post("/api/v1/planner/exams/", {"title": "Partiel BDD", "date": exam_date,
                                                "documents": [ready_document.pk]},
                    format="json")
    assert exam.status_code == 201, exam.data
    assert exam.data["days_left"] == 6
    plan = api.get(f"/api/v1/planner/exams/{exam.data['id']}/plan/").data
    assert len(plan["days"]) == 6
    created = api.post(f"/api/v1/planner/exams/{exam.data['id']}/plan/tasks/").data["created"]
    tasks = api.get("/api/v1/planner/tasks/", {"exam": exam.data["id"]}).data
    assert tasks["count"] == created > 0


def test_task_done_timestamp(api):
    task = api.post("/api/v1/planner/tasks/", {"title": "Relire le chapitre 3"},
                    format="json").data
    done = api.patch(f"/api/v1/planner/tasks/{task['id']}/", {"is_done": True},
                     format="json").data
    assert done["done_at"] is not None


def test_session_logging_validation(api):
    ok = api.post("/api/v1/planner/sessions/", {"minutes": 25, "kind": "pomodoro",
                                                 "started_at": timezone.now().isoformat()},
                  format="json")
    assert ok.status_code == 201
    bad = api.post("/api/v1/planner/sessions/", {"minutes": 600,
                                                  "started_at": timezone.now().isoformat()},
                   format="json")
    assert bad.status_code == 400
