from rest_framework import serializers

from .models import Card, Deck


class CardSerializer(serializers.ModelSerializer):
    is_mastered = serializers.BooleanField(read_only=True)

    class Meta:
        model = Card
        fields = ("id", "deck", "front", "back", "page", "ease", "interval_days",
                  "repetitions", "lapses", "due_at", "last_reviewed_at", "is_mastered")
        read_only_fields = ("ease", "interval_days", "repetitions", "lapses", "due_at",
                            "last_reviewed_at")

    def validate_deck(self, deck):
        if deck.owner != self.context["request"].user:
            raise serializers.ValidationError("Paquet introuvable.")
        return deck


class DeckSerializer(serializers.ModelSerializer):
    document_title = serializers.CharField(source="document.title", read_only=True,
                                           default=None)
    card_count = serializers.IntegerField(read_only=True)
    due_count = serializers.IntegerField(read_only=True)
    mastered_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Deck
        fields = ("id", "title", "description", "document", "document_title", "generated_by",
                  "card_count", "due_count", "mastered_count", "created_at")
        read_only_fields = ("generated_by", "created_at")


class GenerateDeckSerializer(serializers.Serializer):
    document = serializers.IntegerField()
    count = serializers.IntegerField(min_value=5, max_value=50, default=20)


class ReviewSerializer(serializers.Serializer):
    grade = serializers.IntegerField(min_value=0, max_value=3)
