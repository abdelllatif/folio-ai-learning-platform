"""Streak maths, framework-free."""
from datetime import date, timedelta


def current_streak(active_days: set[date], today: date) -> int:
    """Consecutive active days ending today — or yesterday, so a streak isn't shown as
    broken in the morning before the student has studied."""
    day = today if today in active_days else today - timedelta(days=1)
    streak = 0
    while day in active_days:
        streak += 1
        day -= timedelta(days=1)
    return streak


def longest_streak(active_days: set[date]) -> int:
    best = run = 0
    prev = None
    for day in sorted(active_days):
        run = run + 1 if prev and day - prev == timedelta(days=1) else 1
        best, prev = max(best, run), day
    return best
