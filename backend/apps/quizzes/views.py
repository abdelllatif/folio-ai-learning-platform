from django.db.models import Count, Max, Prefetch
from django.shortcuts import get_object_or_404
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.throttles import AIRateThrottle
from apps.documents.models import Document

from . import services
from .models import AttemptAnswer, Choice, Question, Quiz, QuizAttempt
from .serializers import (
    AttemptDetailSerializer,
    AttemptSerializer,
    GenerateQuizSerializer,
    QuizListSerializer,
    QuizPlaySerializer,
    QuestionPlaySerializer,
    SubmitSerializer,
)


class QuizViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.DestroyModelMixin,
                  viewsets.GenericViewSet):
    filterset_fields = ("document", "difficulty")
    search_fields = ("title", "focus")
    ordering_fields = ("created_at", "best_percent")

    def get_queryset(self):
        return (Quiz.objects.filter(owner=self.request.user).select_related("document")
                .annotate(question_count=Count("questions", distinct=True),
                          attempt_count=Count("attempts", distinct=True),
                          best_percent=Max("attempts__percent"))
                .prefetch_related(Prefetch("questions",
                                           queryset=Question.objects.prefetch_related("choices"))))

    def get_serializer_class(self):
        return QuizPlaySerializer if self.action == "retrieve" else QuizListSerializer

    @action(detail=False, methods=["post"], throttle_classes=[AIRateThrottle])
    def generate(self, request):
        payload = GenerateQuizSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        data = payload.validated_data
        document = get_object_or_404(Document, pk=data.pop("document"), owner=request.user)
        quiz = services.generate_quiz(request.user, document, **data)
        quiz = self.get_queryset().get(pk=quiz.pk)
        return Response(QuizPlaySerializer(quiz).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        quiz = self.get_object()
        payload = SubmitSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        attempt = services.submit_attempt(request.user, quiz, **payload.validated_data)
        return Response(AttemptDetailSerializer(_attempt_detail_qs().get(pk=attempt.pk)).data,
                        status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"])
    def mistakes(self, request, pk=None):
        """Questions answered wrongly in the latest attempt — for a « retry my mistakes » run."""
        quiz = self.get_object()
        ids = services.last_mistakes(request.user, quiz)
        questions = quiz.questions.filter(pk__in=ids).prefetch_related("choices")
        return Response(QuestionPlaySerializer(questions, many=True).data)


def _attempt_detail_qs():
    return QuizAttempt.objects.select_related("quiz__document").prefetch_related(
        Prefetch("answers", queryset=AttemptAnswer.objects.select_related("question")
                 .prefetch_related(Prefetch("question__choices",
                                            queryset=Choice.objects.order_by("order")))))


class AttemptViewSet(viewsets.ReadOnlyModelViewSet):
    """Full history of the student's quiz attempts."""

    filterset_fields = ("quiz", "quiz__document", "mode")
    ordering_fields = ("completed_at", "percent")

    def get_queryset(self):
        if self.action == "retrieve":
            return _attempt_detail_qs().filter(user=self.request.user)
        return QuizAttempt.objects.filter(user=self.request.user).select_related("quiz__document")

    def get_serializer_class(self):
        return AttemptDetailSerializer if self.action == "retrieve" else AttemptSerializer
