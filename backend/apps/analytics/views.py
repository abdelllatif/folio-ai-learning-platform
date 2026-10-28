from datetime import timedelta

from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response

from apps.core.exceptions import DomainError

from . import selectors


@api_view(["GET"])
def dashboard(request):
    return Response(selectors.dashboard(request.user))


@api_view(["GET"])
def activity(request):
    """Daily activity for the heatmap (last ``days`` days, max 400)."""
    days = min(max(int(request.query_params.get("days", 120)), 7), 400)
    data = selectors.activity_by_day(request.user, days)
    today = timezone.localdate()
    series = []
    for i in range(days - 1, -1, -1):
        day = today - timedelta(days=i)
        series.append({"date": day.isoformat(), "count": data["counts"].get(day, 0),
                       "minutes": data["minutes"].get(day, 0)})
    return Response(series)


@api_view(["GET"])
def progress(request):
    return Response(selectors.progress_by_document(request.user))


@api_view(["GET"])
def search(request):
    query = request.query_params.get("q", "")
    if len(query.strip()) < 2:
        raise DomainError("Saisissez au moins 2 caractères.", code="query_too_short")
    return Response(selectors.global_search(request.user, query))
