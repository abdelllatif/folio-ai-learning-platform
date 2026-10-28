from datetime import date

from .streaks import current_streak, longest_streak

D = date.fromisoformat


def test_current_streak_counts_until_today_or_yesterday():
    days = {D("2026-10-25"), D("2026-10-26"), D("2026-10-27")}
    assert current_streak(days, D("2026-10-27")) == 3
    assert current_streak(days, D("2026-10-28")) == 3  # not studied yet today
    assert current_streak(days, D("2026-10-30")) == 0


def test_longest_streak():
    days = {D("2026-09-01"), D("2026-09-02"), D("2026-09-05"), D("2026-09-06"),
            D("2026-09-07")}
    assert longest_streak(days) == 3
    assert longest_streak(set()) == 0
