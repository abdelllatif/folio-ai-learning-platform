from .base import *  # noqa: F401,F403
from .base import env_bool

DEBUG = False
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
# Set SECURE_COOKIES=0 only for a local HTTP stack (docker compose on localhost).
SESSION_COOKIE_SECURE = CSRF_COOKIE_SECURE = env_bool("SECURE_COOKIES", True)
CSRF_TRUSTED_ORIGINS = [o for o in CORS_ALLOWED_ORIGINS]  # noqa: F405
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
