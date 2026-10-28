"""Aggregations over every learning app. Read-only by design."""
from collections import defaultdict
from datetime import timedelta

from django.db.models import Avg, Count, Max, Q, Sum
from django.db.models.functions import TruncDate
from django.utils import timezone

from apps.chat.models import Conversation, Message
from apps.documents.models import Document
from apps.flashcards.models import MASTERED_INTERVAL_DAYS, Card, CardReview
from apps.notes.models import Note
from apps.planner.models import Exam, StudySession, StudyTask
from apps.quizzes.models import Quiz, QuizAttempt

from .streaks import current_streak, longest_streak


def _per_day(qs, field: str) -> dict:
    tz = timezone.get_current_timezone()
    return {row["day"]: row["n"] for row in
            qs.annotate(day=TruncDate(field, tzinfo=tz)).values("day").annotate(n=Count("id"))}


def activity_by_day(user, days: int = 120) -> dict:
    since = timezone.now() - timedelta(days=days)
    counts: dict = defaultdict(int)
    sources = [
        (StudySession.objects.filter(user=user, started_at__gte=since), "started_at"),
        (QuizAttempt.objects.filter(user=user, completed_at__gte=since), "completed_at"),
        (CardReview.objects.filter(user=user, reviewed_at__gte=since), "reviewed_at"),
        (Message.objects.filter(conversation__owner=user, role="user", created_at__gte=since),
         "created_at"),
        (Note.objects.filter(owner=user, created_at__gte=since), "created_at"),
    ]
    for qs, field in sources:
        for day, n in _per_day(qs, field).items():
            counts[day] += n

    tz = timezone.get_current_timezone()
    minutes = {row["day"]: row["m"] for row in
               StudySession.objects.filter(user=user, started_at__gte=since)
               .annotate(day=TruncDate("started_at", tzinfo=tz)).values("day")
               .annotate(m=Sum("minutes"))}
    return {"counts": dict(counts), "minutes": minutes}


def badges(user, stats: dict) -> list[dict]:
    defs = [
        ("first_document", "Premier cours", "Déposer votre premier document",
         stats["documents"]["total"] >= 1),
        ("library_10", "Bibliothécaire", "Avoir 10 documents dans la bibliothèque",
         stats["documents"]["total"] >= 10),
        ("first_quiz", "Premier quiz", "Terminer un quiz", stats["quizzes"]["attempts"] >= 1),
        ("perfect_score", "Sans faute", "Obtenir 100 % à un quiz",
         stats["quizzes"]["best"] == 100),
        ("streak_7", "Une semaine d'affilée", "Étudier 7 jours de suite",
         stats["streak"]["longest"] >= 7),
        ("streak_30", "Régularité", "Étudier 30 jours de suite",
         stats["streak"]["longest"] >= 30),
        ("cards_100", "Mémoire d'éléphant", "Réviser 100 fiches",
         stats["flashcards"]["reviews"] >= 100),
        ("curious", "Curieux", "Poser 25 questions à l'assistant",
         stats["chat"]["questions"] >= 25),
    ]
    return [{"code": c, "title": t, "description": d, "earned": bool(e)} for c, t, d, e in defs]


def dashboard(user) -> dict:
    now = timezone.now()
    today = timezone.localdate()
    week_start = today - timedelta(days=today.weekday())

    docs = Document.objects.filter(owner=user)
    by_status = dict(docs.values_list("status").annotate(n=Count("id")))
    attempts = QuizAttempt.objects.filter(user=user)
    quiz_agg = attempts.aggregate(avg=Avg("percent"), best=Max("percent"), n=Count("id"))
    cards = Card.objects.filter(deck__owner=user)
    activity = activity_by_day(user, days=400)
    active_days = set(activity["counts"])
    week_minutes = [
        {"date": (week_start + timedelta(d)).isoformat(),
         "minutes": activity["minutes"].get(week_start + timedelta(d), 0)} for d in range(7)]
    today_minutes = activity["minutes"].get(today, 0)

    stats = {
        "documents": {"total": docs.count(), "ready": by_status.get("ready", 0),
                      "processing": by_status.get("processing", 0) + by_status.get("pending", 0),
                      "failed": by_status.get("failed", 0),
                      "pages": docs.aggregate(p=Sum("page_count"))["p"] or 0},
        "quizzes": {"count": Quiz.objects.filter(owner=user).count(),
                    "attempts": quiz_agg["n"], "average": round(quiz_agg["avg"] or 0, 1),
                    "best": quiz_agg["best"] or 0},
        "flashcards": {"total": cards.count(), "due": cards.filter(due_at__lte=now).count(),
                       "mastered": cards.filter(interval_days__gte=MASTERED_INTERVAL_DAYS).count(),
                       "reviews": CardReview.objects.filter(user=user).count()},
        "chat": {"conversations": Conversation.objects.filter(owner=user).count(),
                 "questions": Message.objects.filter(conversation__owner=user,
                                                     role="user").count()},
        "notes": Note.objects.filter(owner=user).count(),
        "streak": {"current": current_streak(active_days, today),
                   "longest": longest_streak(active_days),
                   "active_today": today in active_days},
        "goal": {"daily_minutes": user.daily_goal_minutes, "today_minutes": today_minutes,
                 "percent": min(100, round(100 * today_minutes / max(1, user.daily_goal_minutes)))},
        "week": week_minutes,
    }
    stats["badges"] = badges(user, stats)

    stats["continue_reading"] = list(
        docs.filter(status="ready", last_opened_at__isnull=False).order_by("-last_opened_at")
        .values("id", "title", "last_page", "page_count", "last_opened_at")[:4])
    stats["recent_documents"] = list(
        docs.order_by("-created_at").values("id", "title", "status", "created_at",
                                            "page_count")[:5])
    stats["score_trend"] = [
        {"date": a.completed_at.isoformat(), "percent": a.percent, "quiz": a.quiz.title}
        for a in attempts.select_related("quiz").order_by("-completed_at")[:12]][::-1]
    stats["upcoming_exams"] = [
        {"id": e.id, "title": e.title, "date": e.date.isoformat(),
         "days_left": (e.date - today).days}
        for e in Exam.objects.filter(owner=user, date__gte=today).order_by("date")[:3]]
    stats["tasks_today"] = list(
        StudyTask.objects.filter(owner=user, is_done=False)
        .filter(Q(due_date__lte=today) | Q(due_date__isnull=True))
        .order_by("due_date").values("id", "title", "due_date", "priority")[:6])
    stats["weak_documents"] = weak_documents(user)
    return stats


def weak_documents(user, threshold: float = 60.0) -> list[dict]:
    rows = (QuizAttempt.objects.filter(user=user, mode="full")
            .values("quiz__document_id", "quiz__document__title")
            .annotate(avg=Avg("percent"), n=Count("id")).filter(avg__lt=threshold)
            .order_by("avg")[:4])
    return [{"id": r["quiz__document_id"], "title": r["quiz__document__title"],
             "average": round(r["avg"], 1), "attempts": r["n"]} for r in rows]


def progress_by_document(user) -> list[dict]:
    """Mastery overview: quiz average, card mastery, notes and questions per document."""
    quiz = {r["quiz__document_id"]: r for r in
            QuizAttempt.objects.filter(user=user).values("quiz__document_id")
            .annotate(avg=Avg("percent"), n=Count("id"), last=Max("completed_at"))}
    cards = {r["deck__document_id"]: r for r in
             Card.objects.filter(deck__owner=user).values("deck__document_id")
             .annotate(total=Count("id"),
                       mastered=Count("id", filter=Q(interval_days__gte=MASTERED_INTERVAL_DAYS)))}
    out = []
    for doc in Document.objects.filter(owner=user, status="ready").select_related("subject"):
        q, c = quiz.get(doc.id, {}), cards.get(doc.id, {})
        quiz_avg = q.get("avg")
        card_pct = 100 * c["mastered"] / c["total"] if c.get("total") else None
        parts = [p for p in (quiz_avg, card_pct) if p is not None]
        out.append({
            "id": doc.id, "title": doc.title,
            "subject": doc.subject.name if doc.subject else None,
            "subject_color": doc.subject.color if doc.subject else None,
            "quiz_average": round(quiz_avg, 1) if quiz_avg is not None else None,
            "quiz_attempts": q.get("n", 0), "last_quiz": q.get("last"),
            "cards_total": c.get("total", 0), "cards_mastered": c.get("mastered", 0),
            "mastery": round(sum(parts) / len(parts)) if parts else 0,
            "notes": doc.notes.count(),
        })
    return sorted(out, key=lambda r: r["mastery"])


def global_search(user, query: str, limit: int = 6) -> dict:
    q = query.strip()
    docs = Document.objects.filter(owner=user).filter(
        Q(title__icontains=q) | Q(short_summary__icontains=q) | Q(original_filename__icontains=q))
    return {
        "documents": list(docs.values("id", "title", "status", "page_count")[:limit]),
        "notes": list(Note.objects.filter(owner=user).filter(
            Q(title__icontains=q) | Q(content__icontains=q) | Q(quote__icontains=q))
            .values("id", "title", "content", "document_id")[:limit]),
        "quizzes": list(Quiz.objects.filter(owner=user, title__icontains=q)
                        .values("id", "title", "document_id")[:limit]),
        "conversations": list(Conversation.objects.filter(owner=user).filter(
            Q(title__icontains=q) | Q(messages__content__icontains=q)).distinct()
            .values("id", "title", "document_id")[:limit]),
    }
