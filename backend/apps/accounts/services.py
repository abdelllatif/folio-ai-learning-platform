"""Plan limits — the business rules separating the free and paid offers."""
from django.conf import settings

from apps.core.exceptions import QuotaExceeded


def plan_limits(user) -> dict:
    return settings.FOLIO_PLANS.get(user.plan, settings.FOLIO_PLANS["free"])


def usage_summary(user) -> dict:
    from apps.documents.models import Document

    limits = plan_limits(user)
    used = Document.objects.filter(owner=user).count()
    return {
        "plan": user.plan,
        "documents_used": used,
        "documents_limit": limits["max_documents"],
        "max_file_mb": limits["max_file_mb"],
    }


def assert_can_upload(user, file_size_bytes: int) -> None:
    from apps.documents.models import Document

    limits = plan_limits(user)
    max_docs = limits["max_documents"]
    if max_docs is not None and Document.objects.filter(owner=user).count() >= max_docs:
        raise QuotaExceeded(
            f"L'offre gratuite permet {max_docs} documents. Supprimez-en un ou passez à "
            "l'offre Étudiant Pro."
        )
    if file_size_bytes > limits["max_file_mb"] * 1024 * 1024:
        raise QuotaExceeded(
            f"Fichier trop volumineux : {limits['max_file_mb']} Mo maximum avec votre offre."
        )
