"""Minimal background task runner.

Document analysis can take minutes (OCR + LLM). Requests must not block, so jobs run
on a small worker pool. In tests (``FOLIO_TASKS_EAGER``) jobs run inline.

The interface (``enqueue``) is deliberately tiny so it can be swapped for Celery/RQ
without touching callers.
"""
from concurrent.futures import ThreadPoolExecutor
import logging

from django.conf import settings
from django.db import close_old_connections

logger = logging.getLogger("folio.tasks")
_executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="folio-worker")


def _run(fn, *args, **kwargs):
    try:
        fn(*args, **kwargs)
    except Exception:  # noqa: BLE001 — a worker must never die silently
        logger.exception("Background task %s failed", getattr(fn, "__name__", fn))
    finally:
        close_old_connections()


def enqueue(fn, *args, **kwargs):
    if getattr(settings, "FOLIO_TASKS_EAGER", False):
        fn(*args, **kwargs)
        return None
    return _executor.submit(_run, fn, *args, **kwargs)
