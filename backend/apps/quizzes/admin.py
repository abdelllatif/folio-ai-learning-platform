from django.contrib import admin

from .models import Choice, Question, Quiz, QuizAttempt


class ChoiceInline(admin.TabularInline):
    model = Choice
    extra = 0


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ("quiz", "order", "kind", "prompt")
    inlines = [ChoiceInline]


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ("title", "owner", "difficulty", "generated_by", "created_at")
    list_filter = ("difficulty", "generated_by")


@admin.register(QuizAttempt)
class AttemptAdmin(admin.ModelAdmin):
    list_display = ("quiz", "user", "score", "total", "percent", "completed_at")
