from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

api_v1 = [
    path("", include("apps.core.urls")),
    path("auth/", include("apps.accounts.urls")),
    path("", include("apps.documents.urls")),
    path("", include("apps.chat.urls")),
    path("", include("apps.quizzes.urls")),
    path("", include("apps.flashcards.urls")),
    path("", include("apps.notes.urls")),
    path("planner/", include("apps.planner.urls")),
    path("analytics/", include("apps.analytics.urls")),
    path("support/", include("apps.support.urls")),
]

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include(api_v1)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
