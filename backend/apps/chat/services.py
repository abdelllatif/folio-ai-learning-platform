from django.db import transaction
from django.utils import timezone

from ai.textproc import truncate
from apps.core.ai import get_ai
from apps.core.exceptions import DocumentNotReady, DomainError
from apps.documents.selectors import load_index

from .models import Conversation, Message

MAX_QUESTION_CHARS = 2000


def start_conversation(user, document, title: str | None = None) -> Conversation:
    if not document.is_ready:
        raise DocumentNotReady()
    return Conversation.objects.create(owner=user, document=document,
                                       title=title or "Nouvelle conversation")


def ask(conversation: Conversation, question: str) -> tuple[Message, Message]:
    question = (question or "").strip()
    if not question:
        raise DomainError("La question est vide.", code="empty_question")
    if len(question) > MAX_QUESTION_CHARS:
        raise DomainError("Question trop longue (2000 caractères maximum).",
                          code="question_too_long")
    document = conversation.document
    if not document.is_ready:
        raise DocumentNotReady()

    history = [{"role": m.role, "content": m.content}
               for m in conversation.messages.order_by("-created_at")[:6]][::-1]
    matrix, items = load_index(document)
    answer = get_ai().study.answer(question, matrix, items, lang=document.language or "fr",
                                   history=history)

    with transaction.atomic():
        user_msg = Message.objects.create(conversation=conversation, role=Message.Role.USER,
                                          content=question)
        bot_msg = Message.objects.create(
            conversation=conversation, role=Message.Role.ASSISTANT, content=answer.text,
            citations=[c.to_dict() for c in answer.citations], follow_ups=answer.follow_ups,
            grounded=answer.grounded, generated_by=answer.generated_by)
        if conversation.title == "Nouvelle conversation":
            conversation.title = truncate(question, 80)
        conversation.updated_at = timezone.now()
        conversation.save(update_fields=["title", "updated_at"])
    return user_msg, bot_msg


def export_markdown(conversation: Conversation) -> str:
    lines = [f"# {conversation.title}", "",
             f"Document : {conversation.document.title}", ""]
    for m in conversation.messages.all():
        who = "**Vous**" if m.role == Message.Role.USER else "**Folio**"
        lines += [f"{who} — {m.created_at:%d/%m/%Y %H:%M}", "", m.content, ""]
        for c in m.citations:
            pages = f"p. {c['page_start']}" + (f"-{c['page_end']}"
                                                if c["page_end"] != c["page_start"] else "")
            lines.append(f"> [{c['marker']}] {pages} — {c['excerpt']}")
        lines.append("")
    return "\n".join(lines)
