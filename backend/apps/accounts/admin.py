from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ("-date_joined",)
    list_display = ("email", "first_name", "last_name", "level", "plan", "date_joined")
    list_filter = ("plan", "level", "is_staff", "is_active")
    search_fields = ("email", "first_name", "last_name", "school")
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Profil", {"fields": ("first_name", "last_name", "school", "field_of_study", "level",
                               "preferred_language", "daily_goal_minutes", "avatar")}),
        ("Offre", {"fields": ("plan",)}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups",
                                    "user_permissions")}),
    )
    add_fieldsets = ((None, {"classes": ("wide",),
                             "fields": ("email", "first_name", "password1", "password2")}),)
