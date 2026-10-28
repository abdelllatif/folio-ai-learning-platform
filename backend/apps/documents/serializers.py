from rest_framework import serializers

from .models import Document, DocumentPage, Subject


class SubjectSerializer(serializers.ModelSerializer):
    document_count = serializers.IntegerField(read_only=True)
    ready_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Subject
        fields = ("id", "name", "color", "icon", "document_count", "ready_count", "created_at")
        read_only_fields = ("id", "created_at")

    def validate_name(self, value):
        user = self.context["request"].user
        qs = Subject.objects.filter(owner=user, name__iexact=value.strip())
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Cette matière existe déjà.")
        return value.strip()


class SubjectMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ("id", "name", "color", "icon")


class DocumentListSerializer(serializers.ModelSerializer):
    subject = SubjectMiniSerializer(read_only=True)
    file_url = serializers.FileField(source="file", read_only=True)

    class Meta:
        model = Document
        fields = (
            "id", "title", "original_filename", "file_url", "file_size", "status", "progress",
            "status_message", "page_count", "reading_minutes", "language", "category",
            "ai_subject", "short_summary", "keywords", "subject", "is_favorite",
            "last_opened_at", "last_page", "created_at",
        )


class DocumentDetailSerializer(DocumentListSerializer):
    class Meta(DocumentListSerializer.Meta):
        fields = DocumentListSerializer.Meta.fields + (
            "error", "word_count", "ocr_pages", "pdf_metadata", "summary", "explanation",
            "key_points", "glossary", "faq", "ai_level", "generated_by", "processed_at",
        )


class DocumentUpdateSerializer(serializers.ModelSerializer):
    subject_id = serializers.PrimaryKeyRelatedField(
        source="subject", queryset=Subject.objects.none(), allow_null=True, required=False)

    class Meta:
        model = Document
        fields = ("title", "subject_id", "is_favorite", "category")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if request:
            self.fields["subject_id"].queryset = Subject.objects.filter(owner=request.user)


class DocumentUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    subject_id = serializers.IntegerField(required=False, allow_null=True)


class DocumentStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ("id", "status", "progress", "status_message", "error", "title")


class DocumentPageSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentPage
        fields = ("number", "text", "ocr_used")
