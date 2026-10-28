from ai.chunking import chunk_pages
from ai.jsonutil import parse_json_loose
from ai.textproc import (
    clean_text,
    detect_language,
    extract_keywords,
    rank_sentences,
    reading_time_minutes,
    strip_repeated_lines,
)
from ai.types import Page

import pytest


def test_clean_text_rejoins_hyphenated_and_wrapped_lines():
    raw = "La normali-\nsation réduit\nla redondance.\n\nNouveau paragraphe."
    assert clean_text(raw) == "La normalisation réduit la redondance.\n\nNouveau paragraphe."


def test_strip_repeated_headers_and_page_numbers():
    pages = [f"Université Hassan II\nContenu {i}\n{i}" for i in range(1, 7)]
    cleaned = strip_repeated_lines(pages)
    assert all("Université" not in p for p in cleaned)
    assert cleaned[2] == "Contenu 3"


def test_language_detection(course_text):
    assert detect_language(course_text) == "fr"
    assert detect_language("The relational model stores data in tables that are linked.") == "en"
    assert detect_language("قاعدة البيانات هي مجموعة منظمة من المعلومات") == "ar"


def test_keywords_and_ranking(course_text):
    kws = extract_keywords(course_text)
    assert "table" in " ".join(kws) or "tables" in kws
    ranked = rank_sentences(course_text, limit=3)
    assert len(ranked) == 3
    assert reading_time_minutes(course_text) == 1


def test_chunking_keeps_pages_and_overlap():
    pages = [Page(1, "Phrase un est ici. " * 30), Page(2, "Phrase deux est là. " * 30)]
    chunks = chunk_pages(pages, size=200, overlap=40)
    assert chunks[0].page_start == 1 and chunks[-1].page_end == 2
    assert all(len(c.text) <= 240 for c in chunks)
    assert any(c.page_start == 1 and c.page_end == 2 for c in chunks)
    # consecutive chunks share text (overlap)
    assert chunks[1].text.split(". ")[0] in chunks[0].text


def test_chunking_rejects_bad_overlap():
    with pytest.raises(ValueError):
        chunk_pages([Page(1, "x")], size=100, overlap=100)


@pytest.mark.parametrize("raw", [
    'Voici le JSON :\n```json\n{"a": [1, 2]}\n```',
    'Bien sûr ! {"a": [1, 2],} Bonne révision.',
    '{"a": [1, 2]}',
])
def test_parse_json_loose(raw):
    assert parse_json_loose(raw) == {"a": [1, 2]}


def test_parse_json_loose_raises():
    with pytest.raises(ValueError):
        parse_json_loose("pas de json ici")
