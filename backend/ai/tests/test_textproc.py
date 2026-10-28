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
    topics = ["Les tables", "Les clés", "Le SQL", "Les index", "Les vues", "Les jointures"]
    pages = [f"Université Hassan II – 2025/2026\n{t} en détail.\n{i}" for i, t in enumerate(topics, 1)]
    pages[3] = pages[3].replace("2025/2026", "2026/2027")  # footers vary only by numbers
    cleaned = strip_repeated_lines(pages)
    assert all("Université" not in p for p in cleaned)
    assert cleaned[2] == "Le SQL en détail."


def test_slide_markers_are_removed_but_sentence_kept():
    assert clean_text("Diapo 4 : La cellule est l’unité du vivant.") == "La cellule est l’unité du vivant."


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


def test_headings_stay_separate_from_body():
    raw = "Chapitre 2 — La normalisation\nLa normalisation réduit\nla redondance."
    assert clean_text(raw) == "Chapitre 2 — La normalisation\n\nLa normalisation réduit la redondance."


def test_table_of_contents_and_narration_are_not_key_points():
    text = ("Chapitre 1. Définition de la cellule ........................ 6\n\n"
            "Nous verrons ensuite la composition du cytosol en détail dans ce chapitre. "
            "Le cytosol est la phase liquide où baignent les organites de la cellule. "
            "Le cation principal du cytosol est le potassium, le sodium reste extracellulaire.")
    assert "....." not in clean_text(text)
    ranked = rank_sentences(clean_text(text), limit=5)
    assert ranked and all("Nous" not in r and "Chapitre" not in r for r in ranked)
