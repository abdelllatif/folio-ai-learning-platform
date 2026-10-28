from django.contrib import admin

from .models import ContactMessage, NewsletterSubscriber


@admin.register(ContactMessage)
class ContactAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "topic", "organization", "is_handled", "created_at")
    list_filter = ("topic", "is_handled")
    list_editable = ("is_handled",)
    search_fields = ("name", "email", "organization", "message")


admin.site.register(NewsletterSubscriber, list_display=("email", "is_active", "created_at"))
