"""SM-2 spaced-repetition scheduling (SuperMemo 2), framework-free.

Grades shown to the student map to SM-2 qualities:
  0 « À revoir »  → 1   (forgotten: card comes back today)
  1 « Difficile » → 3
  2 « Bien »      → 4
  3 « Facile »    → 5
"""
from dataclasses import dataclass
from datetime import datetime, timedelta

GRADE_TO_QUALITY = {0: 1, 1: 3, 2: 4, 3: 5}
MIN_EASE = 1.3


@dataclass(frozen=True)
class Schedule:
    ease: float
    interval_days: int
    repetitions: int
    lapses: int
    due_at: datetime


def review(ease: float, interval_days: int, repetitions: int, lapses: int, grade: int,
           now: datetime) -> Schedule:
    if grade not in GRADE_TO_QUALITY:
        raise ValueError("grade must be 0, 1, 2 or 3")
    q = GRADE_TO_QUALITY[grade]

    if q < 3:  # lapse: restart the learning steps, see it again in 10 minutes
        return Schedule(ease=max(MIN_EASE, ease - 0.2), interval_days=0, repetitions=0,
                        lapses=lapses + 1, due_at=now + timedelta(minutes=10))

    if repetitions == 0:
        interval = 1
    elif repetitions == 1:
        interval = 6
    else:
        interval = round(interval_days * ease)
    if q == 5:
        interval = round(interval * 1.3) or 1  # « Facile » pushes further

    new_ease = max(MIN_EASE, ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)))
    return Schedule(ease=round(new_ease, 3), interval_days=interval,
                    repetitions=repetitions + 1, lapses=lapses,
                    due_at=now + timedelta(days=interval))
