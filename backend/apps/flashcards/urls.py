from rest_framework.routers import DefaultRouter

from .views import CardViewSet, DeckViewSet

router = DefaultRouter()
router.register("decks", DeckViewSet, basename="deck")
router.register("cards", CardViewSet, basename="card")

urlpatterns = router.urls
