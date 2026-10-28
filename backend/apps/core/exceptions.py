"""Uniform error payloads: ``{"error": {"code", "message", "details"}}``."""
from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework.views import exception_handler


class DomainError(APIException):
    """Business-rule violation raised from the service layer."""

    status_code = status.HTTP_400_BAD_REQUEST
    default_code = "domain_error"
    default_detail = "Action impossible."

    def __init__(self, message=None, code=None, status_code=None):
        super().__init__(detail=message or self.default_detail, code=code or self.default_code)
        if status_code:
            self.status_code = status_code


class QuotaExceeded(DomainError):
    status_code = status.HTTP_402_PAYMENT_REQUIRED
    default_code = "quota_exceeded"
    default_detail = "Vous avez atteint la limite de votre offre."


class DocumentNotReady(DomainError):
    status_code = status.HTTP_409_CONFLICT
    default_code = "document_not_ready"
    default_detail = "Le document est encore en cours d'analyse."


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return None

    code = getattr(exc, "default_code", "error")
    if hasattr(exc, "get_codes"):
        codes = exc.get_codes()
        if isinstance(codes, str):
            code = codes

    data = response.data
    if isinstance(data, dict) and "detail" in data and len(data) == 1:
        message, details = str(data["detail"]), None
    elif isinstance(data, list):
        message, details = str(data[0]), data
    else:
        message, details = "Certains champs sont invalides.", data
        code = "validation_error" if code in ("invalid", "error") else code

    response.data = {"error": {"code": code, "message": message, "details": details}}
    return response
