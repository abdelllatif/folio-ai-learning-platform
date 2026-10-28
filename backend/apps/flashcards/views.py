from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.throttles import AIRateThrottle
from apps.documents.models import Document

from . import services
from .models import MASTERED_INTERVAL_DAYS, Card, Deck
from .serializers import CardSerializer, DeckSerializer, GenerateDeckSerializer, ReviewSerializer


class DeckViewSet(viewsets.ModelViewSet):
    filterset_fields = ("document",)
    search_fields = ("title",)

    def get_queryset(self):
        now = timezone.now()
        return (Deck.objects.filter(owner=self.request.user).select_related("document")
                .annotate(card_count=Count("cards"),
                          due_count=Count("cards", filter=Q(cards__due_at__lte=now)),
                          mastered_count=Count("cards", filter=Q(
                              cards__interval_days__gte=MASTERED_INTERVAL_DAYS))))

    serializer_class = DeckSerializer

    def perform_create(self, serializer):
        document = serializer.validated_data.get("document")
        if document and document.owner != self.request.user:
            document = None
        serializer.save(owner=self.request.user, document=document)

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        response.data = DeckSerializer(self.get_queryset().get(pk=response.data["id"])).data
        return response

    @action(detail=False, methods=["post"], throttle_classes=[AIRateThrottle])
    def generate(self, request):
        payload = GenerateDeckSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        document = get_object_or_404(Document, pk=payload.validated_data["document"],
                                     owner=request.user)
        deck = services.generate_deck(request.user, document, payload.validated_data["count"])
        return Response(DeckSerializer(self.get_queryset().get(pk=deck.pk)).data,
                        status=status.HTTP_201_CREATED)


class CardViewSet(viewsets.ModelViewSet):
    serializer_class = CardSerializer
    filterset_fields = ("deck",)
    search_fields = ("front", "back")

    def get_queryset(self):
        return Card.objects.filter(deck__owner=self.request.user)

    @action(detail=False, methods=["get"])
    def due(self, request):
        """Cards to review now (optionally for one deck), most overdue first."""
        qs = self.filter_queryset(self.get_queryset()).filter(due_at__lte=timezone.now())
        limit = min(int(request.query_params.get("limit", 50)), 200)
        return Response(CardSerializer(qs[:limit], many=True).data)

    @action(detail=True, methods=["post"])
    def review(self, request, pk=None):
        payload = ReviewSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        card = services.review_card(request.user, self.get_object(),
                                    payload.validated_data["grade"])
        return Response(CardSerializer(card).data)
