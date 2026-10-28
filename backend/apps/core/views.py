from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .ai import get_ai


@api_view(["GET"])
@permission_classes([AllowAny])
def health(request):
    """Liveness + AI availability, used by the frontend status badge."""
    ai = get_ai()
    return Response({
        "status": "ok",
        "llm": {"model": ai.llm.model_name, "available": ai.llm.is_available()},
        "embeddings": ai.embedder.name,
    })
