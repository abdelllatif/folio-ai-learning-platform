from rest_framework import serializers

from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ("id", "role", "content", "citations", "follow_ups", "grounded",
                  "generated_by", "feedback", "created_at")
        read_only_fields = fields


class ConversationSerializer(serializers.ModelSerializer):
    document_title = serializers.CharField(source="document.title", read_only=True)
    message_count = serializers.IntegerField(read_only=True)
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ("id", "document", "document_title", "title", "is_pinned", "message_count",
                  "last_message", "created_at", "updated_at")
        read_only_fields = ("id", "document_title", "message_count", "created_at", "updated_at")

    def get_last_message(self, obj):
        msg = obj.messages.order_by("-created_at").first()
        return msg.content[:140] if msg else ""


class ConversationDetailSerializer(ConversationSerializer):
    messages = MessageSerializer(many=True, read_only=True)

    class Meta(ConversationSerializer.Meta):
        fields = ConversationSerializer.Meta.fields + ("messages",)


class AskSerializer(serializers.Serializer):
    content = serializers.CharField(max_length=2000)


class FeedbackSerializer(serializers.Serializer):
    value = serializers.ChoiceField(choices=[1, -1, 0])
