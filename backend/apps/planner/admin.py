from django.contrib import admin

from .models import Exam, StudySession, StudyTask

admin.site.register(Exam, list_display=("title", "owner", "date"))
admin.site.register(StudyTask, list_display=("title", "owner", "due_date", "is_done"))
admin.site.register(StudySession, list_display=("user", "kind", "minutes", "started_at"))
