from django.db import transaction
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Exam, StudySession, StudyTask
from .revision import build_plan
from .serializers import ExamSerializer, StudySessionSerializer, StudyTaskSerializer


class ExamViewSet(viewsets.ModelViewSet):
    serializer_class = ExamSerializer
    filterset_fields = ("subject",)

    def get_queryset(self):
        qs = Exam.objects.filter(owner=self.request.user).prefetch_related("documents")
        if self.request.query_params.get("upcoming") == "1":
            qs = qs.filter(date__gte=timezone.localdate())
        return qs

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def _plan(self, exam):
        docs = [{"id": d.id, "title": d.title, "reading_minutes": d.reading_minutes}
                for d in exam.documents.all()]
        return build_plan(timezone.localdate(), exam.date, docs, exam.daily_minutes)

    @action(detail=True, methods=["get"])
    def plan(self, request, pk=None):
        """Day-by-day revision plan until the exam."""
        exam = self.get_object()
        return Response({"exam": ExamSerializer(exam, context={"request": request}).data,
                         "days": self._plan(exam)})

    @action(detail=True, methods=["post"], url_path="plan/tasks")
    def plan_to_tasks(self, request, pk=None):
        """Turn the plan into checkable tasks (replaces tasks previously created from it)."""
        exam = self.get_object()
        with transaction.atomic():
            StudyTask.objects.filter(owner=request.user, exam=exam, is_done=False).delete()
            tasks = [StudyTask(owner=request.user, exam=exam, title=item["label"],
                               due_date=day["date"], document_id=item["document_id"],
                               priority="high" if item["kind"] == "review" else "normal")
                     for day in self._plan(exam) for item in day["items"]
                     if item["kind"] != "rest"]
            StudyTask.objects.bulk_create(tasks)
        return Response({"created": len(tasks)}, status=status.HTTP_201_CREATED)


class StudyTaskViewSet(viewsets.ModelViewSet):
    serializer_class = StudyTaskSerializer
    filterset_fields = ("is_done", "priority", "document", "exam", "due_date")
    search_fields = ("title",)
    ordering_fields = ("due_date", "created_at", "priority")

    def get_queryset(self):
        qs = StudyTask.objects.filter(owner=self.request.user).select_related("document")
        when = self.request.query_params.get("when")
        today = timezone.localdate()
        if when == "today":
            qs = qs.filter(due_date=today)
        elif when == "overdue":
            qs = qs.filter(due_date__lt=today, is_done=False)
        elif when == "upcoming":
            qs = qs.filter(due_date__gt=today)
        return qs

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class StudySessionViewSet(viewsets.ModelViewSet):
    serializer_class = StudySessionSerializer
    filterset_fields = ("kind", "document")
    http_method_names = ["get", "post", "delete"]

    def get_queryset(self):
        return StudySession.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
