from rest_framework.routers import DefaultRouter

from .views import ExamViewSet, StudySessionViewSet, StudyTaskViewSet

router = DefaultRouter()
router.register("exams", ExamViewSet, basename="exam")
router.register("tasks", StudyTaskViewSet, basename="task")
router.register("sessions", StudySessionViewSet, basename="session")

urlpatterns = router.urls
