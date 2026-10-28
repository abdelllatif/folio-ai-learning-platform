from django.contrib import admin

from .models import Document, DocumentChunk, DocumentPage, Subject


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ("name", "owner", "color", "created_at")
    search_fields = ("name", "owner__email")


class PageInline(admin.TabularInline):
    model = DocumentPage
    extra = 0
    fields = ("number", "ocr_used")
    readonly_fields = fields
    show_change_link = False


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ("title", "owner", "status", "page_count", "language", "generated_by",
                    "created_at")
    list_filter = ("status", "language", "category", "generated_by")
    search_fields = ("title", "original_filename", "owner__email")
    readonly_fields = ("processed_at", "pdf_metadata", "progress")
    inlines = [PageInline]


@admin.register(DocumentChunk)
class ChunkAdmin(admin.ModelAdmin):
    list_display = ("document", "index", "page_start", "page_end")
    exclude = ("embedding",)
