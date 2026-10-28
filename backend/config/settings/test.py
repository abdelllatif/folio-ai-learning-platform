"""Test settings: SQLite in memory, inline tasks, light AI adapters (no network, no torch)."""
from .base import *  # noqa: F401,F403
from .base import FOLIO_AI, REST_FRAMEWORK

DATABASES = {"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}}
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
FOLIO_TASKS_EAGER = True
FOLIO_AI = {**FOLIO_AI, "EMBEDDING_LIGHT": True, "OCR_ENABLED": False,
            "OLLAMA_BASE_URL": "http://127.0.0.1:9"}  # unreachable on purpose → fallbacks
REST_FRAMEWORK = {**REST_FRAMEWORK, "DEFAULT_THROTTLE_CLASSES": ()}
MEDIA_ROOT = BASE_DIR / ".test-media"
