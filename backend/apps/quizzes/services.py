from django.db import transaction

from apps.core.ai import get_ai
from apps.core.exceptions import DocumentNotReady, DomainError
from apps.documents.selectors import load_index, representative_passages

from .models import AttemptAnswer, Choice, Question, Quiz, QuizAttempt

ALLOWED_KINDS = {"mcq", "true_false"}


def generate_quiz(user, document, count: int = 10, difficulty: str = "moyen",
                  kinds: list[str] | None = None, focus: str = "",
                  time_limit_minutes: int | None = None) -> Quiz:
    if not document.is_ready:
        raise DocumentNotReady()
    kinds = [k for k in (kinds or ["mcq", "true_false"]) if k in ALLOWED_KINDS] or ["mcq"]
    study = get_ai().study

    if focus.strip():
        matrix, items = load_index(document)
        passages = study.retrieve(focus, matrix, items, top_k=10)
        if not passages:
            raise DomainError(f"Le document ne parle pas de « {focus} ».", code="focus_not_found")
    else:
        passages = representative_passages(document)

    drafts, source = study.generate_quiz(passages, n=count, difficulty=difficulty,
                                         kinds=kinds, lang=document.language or "fr")
    if not drafts:
        raise DomainError("Impossible de générer des questions à partir de ce document.",
                          code="quiz_generation_failed")

    label = dict(Quiz.Difficulty.choices).get(difficulty, "Moyen")
    title = f"{document.title} — {focus.strip() or 'Quiz'} ({label.lower()})"
    with transaction.atomic():
        quiz = Quiz.objects.create(owner=user, document=document, title=title[:200],
                                   difficulty=difficulty, focus=focus[:160],
                                   time_limit_minutes=time_limit_minutes, generated_by=source)
        for order, draft in enumerate(drafts, start=1):
            question = Question.objects.create(quiz=quiz, order=order, kind=draft.kind,
                                               prompt=draft.prompt, explanation=draft.explanation,
                                               page=draft.page)
            Choice.objects.bulk_create([
                Choice(question=question, order=i, text=text[:500],
                       is_correct=(i == draft.answer_index))
                for i, text in enumerate(draft.choices)])
    return quiz


def submit_attempt(user, quiz: Quiz, answers: dict, duration_seconds: int = 0,
                   mode: str = QuizAttempt.Mode.FULL) -> QuizAttempt:
    """``answers`` maps question id → choice id (or None when skipped).

    In ``full`` mode every question counts (unanswered = wrong); in ``mistakes`` mode only
    the submitted questions are graded.
    """
    questions = {q.pk: q for q in quiz.questions.prefetch_related("choices")}
    try:
        answers = {int(k): (int(v) if v not in (None, "") else None) for k, v in answers.items()}
    except (TypeError, ValueError) as exc:
        raise DomainError("Réponses mal formées.", code="invalid_answers") from exc

    unknown = set(answers) - set(questions)
    if unknown:
        raise DomainError("Certaines questions n'appartiennent pas à ce quiz.",
                          code="invalid_answers")
    graded_ids = list(questions) if mode == QuizAttempt.Mode.FULL else list(answers)
    if not graded_ids:
        raise DomainError("Aucune réponse envoyée.", code="invalid_answers")

    with transaction.atomic():
        attempt = QuizAttempt.objects.create(quiz=quiz, user=user, mode=mode,
                                             duration_seconds=max(0, int(duration_seconds)))
        score, rows = 0, []
        for qid in graded_ids:
            question = questions[qid]
            choices = {c.pk: c for c in question.choices.all()}
            choice = choices.get(answers.get(qid))
            correct = bool(choice and choice.is_correct)
            score += correct
            rows.append(AttemptAnswer(attempt=attempt, question=question, choice=choice,
                                      is_correct=correct))
        AttemptAnswer.objects.bulk_create(rows)
        attempt.score, attempt.total = score, len(graded_ids)
        attempt.percent = round(100 * score / len(graded_ids), 1)
        attempt.save(update_fields=["score", "total", "percent"])
    return attempt


def last_mistakes(user, quiz: Quiz) -> list[int]:
    attempt = quiz.attempts.filter(user=user).first()
    if not attempt:
        return []
    return list(attempt.answers.filter(is_correct=False).values_list("question_id", flat=True))
