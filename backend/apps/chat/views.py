from django.db.models import Count
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.throttles import AIRateThrottle
from apps.documents.models import Document

from . import services
from .models import Conversation, Message
from .serializers import (
    AskSerializer,
    ConversationDetailSerializer,
    ConversationSerializer,
    FeedbackSerializer,
    MessageSerializer,
)


class ConversationViewSet(viewsets.ModelViewSet):
    """``/conversations/?document=<id>`` lists the threads linked to one document."""

    filterset_fields = ("document", "is_pinned")
    search_fields = ("title", "messages__content")
    http_method_names = ["get", "post", "patch", "delete"]

    def get_queryset(self):
        return (Conversation.objects.filter(owner=self.request.user)
                .select_related("document").annotate(message_count=Count("messages"))
                .distinct())

    def get_serializer_class(self):
        return ConversationDetailSerializer if self.action == "retrieve" \
            else ConversationSerializer

    def perform_create(self, serializer):
        document = get_object_or_404(Document, pk=self.request.data.get("document"),
                                     owner=self.request.user)
        conversation = services.start_conversation(
            self.request.user, document, serializer.validated_data.get("title"))
        conversation.message_count = 0  # the serializer reads the list annotation
        serializer.instance = conversation

    @action(detail=True, methods=["post"], throttle_classes=[AIRateThrottle])
    def ask(self, request, pk=None):
        conversation = self.get_object()
        payload = AskSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        user_msg, bot_msg = services.ask(conversation, payload.validated_data["content"])
        return Response({"question": MessageSerializer(user_msg).data,
                         "answer": MessageSerializer(bot_msg).data},
                        status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"])
    def export(self, request, pk=None):
        conversation = self.get_object()
        response = HttpResponse(services.export_markdown(conversation),
                                content_type="text/markdown; charset=utf-8")
        response["Content-Disposition"] = f'attachment; filename="conversation-{pk}.md"'
        return response


class MessageViewSet(viewsets.GenericViewSet):
    def get_queryset(self):
        return Message.objects.filter(conversation__owner=self.request.user)

    @action(detail=True, methods=["post"])
    def feedback(self, request, pk=None):
        message = self.get_object()
        payload = FeedbackSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        message.feedback = payload.validated_data["value"] or None
        message.save(update_fields=["feedback"])
        return Response(MessageSerializer(message).data)
