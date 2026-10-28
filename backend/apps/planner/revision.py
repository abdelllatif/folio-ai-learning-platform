"""Revision plan builder (pure function, no Django).

Splits the days before an exam into three phases, the way tutors usually advise:
  1. Learn   (~50 %) — read each document, then make its flashcards
  2. Practice (~35 %) — quizzes per document, retry mistakes
  3. Review  (last days) — flashcards due + a mixed quiz, light the day before
"""
from dataclasses import asdict, dataclass
from datetime import date, timedelta


@dataclass
class PlanItem:
    kind: str  # read | flashcards | quiz | review | rest
    label: str
    minutes: int
    document_id: int | None = None


def _round5(x: float) -> int:
    return max(5, int(5 * round(x / 5)))


def build_plan(today: date, exam_date: date, documents: list[dict],
               daily_minutes: int = 60) -> list[dict]:
    """``documents``: [{"id", "title", "reading_minutes"}]. Returns [{"date", "items"}]."""
    days = (exam_date - today).days
    if days <= 0:
        return []
    if not documents:
        return [{"date": (today + timedelta(d)).isoformat(),
                 "items": [asdict(PlanItem("review", "Révision libre", daily_minutes))]}
                for d in range(days)]

    learn_days = max(1, round(days * 0.5)) if days > 2 else 1
    practice_days = max(0, round(days * 0.35)) if days > 3 else 0
    review_days = max(0, days - learn_days - practice_days)

    plan: list[list[PlanItem]] = [[] for _ in range(days)]

    # 1. learn: spread documents over learn days, heaviest first
    docs = sorted(documents, key=lambda d: -(d.get("reading_minutes") or 10))
    for i, doc in enumerate(docs):
        day = i % learn_days
        read = min(daily_minutes, (doc.get("reading_minutes") or 10) * 1.5)
        plan[day].append(PlanItem("read", f"Lire et comprendre « {doc['title']} »",
                                  _round5(read), doc["id"]))
        plan[day].append(PlanItem("flashcards", f"Créer et réviser les fiches « {doc['title']} »",
                                  15, doc["id"]))

    # 2. practice: one quiz per document, cycling
    for d in range(practice_days):
        doc = docs[d % len(docs)]
        plan[learn_days + d].append(PlanItem("quiz", f"Quiz sur « {doc['title']} »", 20,
                                             doc["id"]))
        plan[learn_days + d].append(PlanItem("flashcards", "Fiches à réviser du jour", 15))

    # 3. review
    for d in range(review_days):
        idx = learn_days + practice_days + d
        if idx == days - 1 and days > 1:
            plan[idx].append(PlanItem("review", "Relecture des résumés et points clés", 30))
            plan[idx].append(PlanItem("rest", "Repos : dormir tôt la veille de l'examen", 0))
        else:
            plan[idx].append(PlanItem("quiz", "Quiz mixte sur tout le programme", 25))
            plan[idx].append(PlanItem("flashcards", "Fiches à réviser du jour", 20))

    return [{"date": (today + timedelta(d)).isoformat(), "items": [asdict(i) for i in items]}
            for d, items in enumerate(plan)]
