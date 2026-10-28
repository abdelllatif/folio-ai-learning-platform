from django.utils import timezone
from rest_framework import serializers

from apps.documents.models import Document, Subject

from .models import Exam, StudySession, StudyTask


class OwnedRelatedField(serializers.PrimaryKeyRelatedField):
    """PK field limited to objects owned by the requesting user."""

    def get_queryset(self):
        return super().get_queryset().filter(owner=self.context["request"].user)


class ExamSerializer(serializers.ModelSerializer):
    subject = OwnedRelatedField(queryset=Subject.objects.all(), allow_null=True, required=False)
    documents = OwnedRelatedField(queryset=Document.objects.all(), many=True, required=False)
    days_left = serializers.SerializerMethodField()

    class Meta:
        model = Exam
        fields = ("id", "title", "subject", "date", "location", "documents", "daily_minutes",
                  "days_left", "created_at")

    def get_days_left(self, obj):
        return (obj.date - timezone.localdate()).days


class StudyTaskSerializer(serializers.ModelSerializer):
    document = OwnedRelatedField(queryset=Document.objects.all(), allow_null=True,
                                 required=False)
    exam = OwnedRelatedField(queryset=Exam.objects.all(), allow_null=True, required=False)
    document_title = serializers.CharField(source="document.title", read_only=True,
                                           default=None)

    class Meta:
        model = StudyTask
        fields = ("id", "title", "due_date", "priority", "document", "document_title", "exam",
                  "is_done", "done_at", "created_at")
        read_only_fields = ("done_at", "created_at")

    def update(self, instance, validated_data):
        if "is_done" in validated_data and validated_data["is_done"] != instance.is_done:
            instance.done_at = timezone.now() if validated_data["is_done"] else None
        return super().update(instance, validated_data)


class StudySessionSerializer(serializers.ModelSerializer):
    document = OwnedRelatedField(queryset=Document.objects.all(), allow_null=True,
                                 required=False)

    class Meta:
        model = StudySession
        fields = ("id", "kind", "document", "minutes", "started_at")

    def validate_minutes(self, value):
        if not 1 <= value <= 240:
            raise serializers.ValidationError("Durée entre 1 et 240 minutes.")
        return value
