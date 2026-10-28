from rest_framework.routers import DefaultRouter

from .views import DocumentViewSet, SubjectViewSet

router = DefaultRouter()
router.register("documents", DocumentViewSet, basename="document")
router.register("subjects", SubjectViewSet, basename="subject")

urlpatterns = router.urls
