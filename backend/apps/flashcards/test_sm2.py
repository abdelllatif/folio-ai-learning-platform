"""Pure unit tests (no database)."""
from datetime import datetime, timedelta, timezone

import pytest

from .sm2 import MIN_EASE, review

NOW = datetime(2026, 10, 28, 9, 0, tzinfo=timezone.utc)


def test_first_reviews_follow_sm2_steps():
    s1 = review(2.5, 0, 0, 0, grade=2, now=NOW)
    assert s1.interval_days == 1 and s1.repetitions == 1
    s2 = review(s1.ease, s1.interval_days, s1.repetitions, 0, grade=2, now=NOW)
    assert s2.interval_days == 6
    s3 = review(s2.ease, s2.interval_days, s2.repetitions, 0, grade=2, now=NOW)
    assert s3.interval_days == round(6 * s2.ease)


def test_forgotten_card_comes_back_soon_and_loses_ease():
    s = review(2.5, 20, 5, 0, grade=0, now=NOW)
    assert s.repetitions == 0 and s.lapses == 1
    assert s.due_at - NOW == timedelta(minutes=10)
    assert s.ease == pytest.approx(2.3)


def test_easy_grows_faster_than_good_and_ease_has_floor():
    good = review(2.5, 6, 2, 0, grade=2, now=NOW)
    easy = review(2.5, 6, 2, 0, grade=3, now=NOW)
    assert easy.interval_days > good.interval_days and easy.ease > good.ease
    s = review(MIN_EASE, 1, 1, 0, grade=1, now=NOW)
    assert s.ease == MIN_EASE


def test_invalid_grade():
    with pytest.raises(ValueError):
        review(2.5, 0, 0, 0, grade=7, now=NOW)
