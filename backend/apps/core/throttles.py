from rest_framework.throttling import UserRateThrottle


class AIRateThrottle(UserRateThrottle):
    """Separate, tighter budget for endpoints that call the LLM."""

    scope = "ai"
