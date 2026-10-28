from django.contrib import admin

from .models import Note


@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ("title", "owner", "document", "page", "updated_at")
    search_fields = ("title", "content", "owner__email")
