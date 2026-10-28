from rest_framework import serializers

from apps.documents.models import Document

from .models import Note


class NoteSerializer(serializers.ModelSerializer):
    document_title = serializers.CharField(source="document.title", read_only=True,
                                           default=None)
    document = serializers.PrimaryKeyRelatedField(queryset=Document.objects.none(),
                                                  allow_null=True, required=False)

    class Meta:
        model = Note
        fields = ("id", "document", "document_title", "page", "title", "quote", "content",
                  "color", "tags", "is_pinned", "created_at", "updated_at")
        read_only_fields = ("created_at", "updated_at")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if request:
            self.fields["document"].queryset = Document.objects.filter(owner=request.user)

    def validate_tags(self, tags):
        if not isinstance(tags, list) or not all(isinstance(t, str) for t in tags):
            raise serializers.ValidationError("Les étiquettes doivent être une liste de textes.")
        return sorted({t.strip().lower()[:30] for t in tags if t.strip()})[:10]

    def validate(self, attrs):
        if not any(attrs.get(k) for k in ("title", "quote", "content")) and not self.instance:
            raise serializers.ValidationError("La note est vide.")
        return attrs
