from django.http import HttpResponse
from rest_framework import viewsets
from rest_framework.decorators import action

from .models import Note
from .serializers import NoteSerializer


class NoteViewSet(viewsets.ModelViewSet):
    serializer_class = NoteSerializer
    filterset_fields = ("document", "color", "is_pinned")
    search_fields = ("title", "content", "quote")
    ordering_fields = ("updated_at", "created_at", "page")

    def get_queryset(self):
        qs = Note.objects.filter(owner=self.request.user).select_related("document")
        tag = self.request.query_params.get("tag")
        # icontains on the JSON text works on PostgreSQL and SQLite alike
        return qs.filter(tags__icontains=f'"{tag.strip().lower()}"') if tag else qs

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=False, methods=["get"])
    def export(self, request):
        """All notes (optionally of one document) as a Markdown revision sheet."""
        notes = self.filter_queryset(self.get_queryset())
        lines = ["# Mes notes Folio", ""]
        for n in notes:
            where = f" — {n.document.title}" if n.document else ""
            page = f", p. {n.page}" if n.page else ""
            lines.append(f"## {n.title or 'Note'}{where}{page}")
            if n.quote:
                lines += ["", f"> {n.quote}"]
            if n.content:
                lines += ["", n.content]
            if n.tags:
                lines += ["", " ".join(f"#{t}" for t in n.tags)]
            lines.append("")
        response = HttpResponse("\n".join(lines), content_type="text/markdown; charset=utf-8")
        response["Content-Disposition"] = 'attachment; filename="notes-folio.md"'
        return response
