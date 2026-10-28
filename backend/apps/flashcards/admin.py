from django.contrib import admin

from .models import Card, Deck


class CardInline(admin.TabularInline):
    model = Card
    extra = 0
    fields = ("front", "back", "interval_days", "due_at")


@admin.register(Deck)
class DeckAdmin(admin.ModelAdmin):
    list_display = ("title", "owner", "document", "generated_by", "created_at")
    inlines = [CardInline]
