import re

from django.shortcuts import get_object_or_404
from django_filters import rest_framework as filters
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from apps.core.exceptions import DomainError

from . import selectors, services
from .models import Document, Subject
from .serializers import (
    DocumentDetailSerializer,
    DocumentListSerializer,
    DocumentPageSerializer,
    DocumentStatusSerializer,
    DocumentUpdateSerializer,
    DocumentUploadSerializer,
    SubjectSerializer,
)


class SubjectViewSet(viewsets.ModelViewSet):
    serializer_class = SubjectSerializer
    pagination_class = None

    def get_queryset(self):
        return selectors.subjects_for(self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class DocumentFilter(filters.FilterSet):
    subject = filters.NumberFilter(field_name="subject_id")
    unsorted = filters.BooleanFilter(field_name="subject", lookup_expr="isnull")

    class Meta:
        model = Document
        fields = ("status", "is_favorite", "category", "language")


class DocumentViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin,
                      mixins.UpdateModelMixin, mixins.DestroyModelMixin,
                      viewsets.GenericViewSet):
    """Library endpoints. Upload is ``POST /documents/`` (multipart)."""

    parser_classes = (MultiPartParser, FormParser, JSONParser)
    filterset_class = DocumentFilter
    search_fields = ("title", "original_filename", "short_summary", "ai_subject")
    ordering_fields = ("created_at", "title", "last_opened_at", "page_count")
    ordering = ("-created_at",)

    def get_queryset(self):
        return selectors.documents_for(self.request.user)

    def get_serializer_class(self):
        if self.action == "list":
            return DocumentListSerializer
        if self.action in ("update", "partial_update"):
            return DocumentUpdateSerializer
        return DocumentDetailSerializer

    def create(self, request):
        serializer = DocumentUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        subject = None
        if serializer.validated_data.get("subject_id"):
            subject = get_object_or_404(Subject, pk=serializer.validated_data["subject_id"],
                                        owner=request.user)
        document = services.upload_document(request.user, serializer.validated_data["file"],
                                            subject)
        return Response(DocumentDetailSerializer(document, context={"request": request}).data,
                        status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        super().update(request, *args, **kwargs)
        return Response(DocumentDetailSerializer(self.get_object(),
                                                 context={"request": request}).data)

    def perform_destroy(self, instance):
        instance.file.delete(save=False)
        instance.delete()

    @action(detail=True, methods=["get"], url_path="status")
    def status_(self, request, pk=None):
        return Response(DocumentStatusSerializer(self.get_object()).data)

    @action(detail=True, methods=["post"])
    def reprocess(self, request, pk=None):
        document = services.request_reprocess(self.get_object())
        return Response(DocumentStatusSerializer(document).data, status=status.HTTP_202_ACCEPTED)

    @action(detail=True, methods=["post"])
    def favorite(self, request, pk=None):
        document = self.get_object()
        document.is_favorite = not document.is_favorite
        document.save(update_fields=["is_favorite"])
        return Response({"is_favorite": document.is_favorite})

    @action(detail=True, methods=["post"])
    def opened(self, request, pk=None):
        page = request.data.get("page")
        document = services.mark_opened(self.get_object(), int(page) if page else None)
        return Response({"last_opened_at": document.last_opened_at,
                         "last_page": document.last_page})

    @action(detail=True, methods=["get"])
    def pages(self, request, pk=None):
        document = self.get_object()
        qs = document.pages.all()
        page_no = request.query_params.get("number")
        if page_no:
            qs = qs.filter(number=page_no)
        page = self.paginate_queryset(qs)
        return self.get_paginated_response(DocumentPageSerializer(page, many=True).data)

    @action(detail=True, methods=["get"])
    def find(self, request, pk=None):
        """Full-text search inside one document, with highlighted snippets per page."""
        document = self.get_object()
        query = (request.query_params.get("q") or "").strip()
        if len(query) < 2:
            raise DomainError("Saisissez au moins 2 caractères.", code="query_too_short")
        pattern = re.compile(re.escape(query), re.I)
        results = []
        for page in document.pages.filter(text__icontains=query):
            for m in list(pattern.finditer(page.text))[:3]:
                start, end = max(0, m.start() - 90), min(len(page.text), m.end() + 90)
                results.append({"page": page.number, "snippet": page.text[start:end].strip(),
                                "match": m.group(0)})
        return Response({"query": query, "count": len(results), "results": results[:50]})
