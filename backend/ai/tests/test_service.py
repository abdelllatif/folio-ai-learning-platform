import json

import numpy as np

from ai.chunking import chunk_pages
from ai.embeddings import HashingEmbedder
from ai.service import StudyAI
from ai.types import Page

from .conftest import OfflineLLM, ScriptedLLM


def _index(text, embedder):
    chunks = chunk_pages([Page(1, text[: len(text) // 2]), Page(2, text[len(text) // 2:])],
                         size=260, overlap=60)
    items = [{"ref": c.index, "text": c.text, "page_start": c.page_start,
              "page_end": c.page_end} for c in chunks]
    return embedder.embed([c.text for c in chunks]), items


def test_hashing_embedder_is_normalized_and_semantic():
    emb = HashingEmbedder()
    vecs = emb.embed(["clé primaire d'une table", "la clé primaire identifie la table",
                      "photosynthèse des plantes"])
    assert np.allclose(np.linalg.norm(vecs, axis=1), 1.0)
    assert vecs[0] @ vecs[1] > vecs[0] @ vecs[2]


def test_offline_analysis_is_extractive(course_text):
    ai = StudyAI(OfflineLLM(), HashingEmbedder())
    result = ai.analyze(course_text, {}, "cours_bdd.pdf")
    assert result.generated_by == "extractive"
    assert result.language == "fr"
    assert result.title == "Introduction aux bases de données"
    assert result.summary and len(result.key_points) >= 3
    terms = {g["term"].lower() for g in result.glossary}
    assert any("clé primaire" in t for t in terms)
    assert result.faq


def test_offline_answer_cites_relevant_passage(course_text):
    emb = HashingEmbedder()
    ai = StudyAI(OfflineLLM(), emb)
    matrix, items = _index(course_text, emb)
    answer = ai.answer("Qu'est-ce qu'une clé primaire ?", matrix, items)
    assert answer.grounded and answer.generated_by == "extractive"
    assert answer.citations and "clé primaire" in answer.citations[0].excerpt.lower()


def test_answer_refuses_off_topic_question(course_text):
    emb = HashingEmbedder()
    ai = StudyAI(OfflineLLM(), emb)
    matrix, items = _index(course_text, emb)
    answer = ai.answer("Quelle est la recette du tajine aux pruneaux ?", matrix, items)
    assert not answer.grounded
    assert answer.citations == []
    assert "ne trouve pas" in answer.text


def test_llm_answer_maps_markers_to_citations(course_text):
    emb = HashingEmbedder()
    llm = ScriptedLLM("Une clé primaire identifie chaque ligne de façon unique [1].",
                      json.dumps({"questions": ["Et une clé étrangère ?"]}))
    ai = StudyAI(llm, emb)
    matrix, items = _index(course_text, emb)
    answer = ai.answer("clé primaire", matrix, items)
    assert answer.generated_by == "llm"
    assert [c.marker for c in answer.citations] == [1]
    assert answer.follow_ups == ["Et une clé étrangère ?"]


def test_llm_quiz_drops_invalid_questions(course_text):
    emb = HashingEmbedder()
    payload = {"questions": [
        {"type": "mcq", "question": "Que garantit ACID ?", "choices": ["La fiabilité",
         "La vitesse", "La couleur", "Le prix"], "answer_index": 0, "page": 2},
        {"type": "mcq", "question": "Invalide", "choices": ["a", "b"], "answer_index": 5},
        {"type": "true_false", "question": "SQL interroge les données.",
         "choices": ["Vrai", "Faux"], "answer_index": 0},
    ]}
    ai = StudyAI(ScriptedLLM(json.dumps(payload)), emb)
    matrix, items = _index(course_text, emb)
    passages = ai.retrieve("bases de données", matrix, items, top_k=6)
    drafts, source = ai.generate_quiz(passages, n=5)
    assert source == "llm"
    assert [d.kind for d in drafts] == ["mcq", "true_false"]
    assert drafts[0].page == 2


def test_offline_quiz_and_flashcards(course_text):
    emb = HashingEmbedder()
    ai = StudyAI(OfflineLLM(), emb)
    matrix, items = _index(course_text, emb)
    passages = ai.retrieve("tables clé données transaction", matrix, items, top_k=6)
    drafts, source = ai.generate_quiz(passages, n=4)
    assert source == "extractive" and drafts
    for d in drafts:
        assert 0 <= d.answer_index < len(d.choices)
    analysis = ai.analyze(course_text, {}, "x.pdf")
    cards, src = ai.generate_flashcards(passages, 6, "fr", analysis.glossary,
                                        analysis.key_points)
    assert src == "extractive" and cards and cards[0].back


def test_title_from_capitalised_pdf_metadata_and_no_heading_terms():
    from ai import fallback

    assert fallback.guess_title("x", {"Title": "Cours de réseaux"}, "a.pdf") == "Cours de réseaux"
    text = "Chapitre 1 — Le modèle\n\nUne clé primaire est un attribut qui identifie chaque ligne."
    assert [g["term"] for g in fallback.glossary(text)] == ["Clé primaire"]


def test_llm_glossary_is_grounded_in_the_document(course_text):
    analysis = {"title": "Bases de données", "summary": "…", "key_points": ["SQL"],
                "category": "Cours"}
    aids = {"glossary": [
        {"term": "Clé primaire",
         "definition": "Attribut qui identifie de façon unique chaque ligne d'une table."},
        {"term": "Normalisation",
         "definition": "Théorie mathématique inventée par Codd pour les algèbres abstraites."},
        {"term": "Hachage", "definition": "Fonction qui transforme une clé en adresse."},
    ], "faq": []}
    llm = ScriptedLLM(json.dumps(analysis), "Explication.", json.dumps(aids))
    result = StudyAI(llm, HashingEmbedder()).analyze(course_text, {}, "x.pdf")
    assert result.generated_by == "llm"
    by_term = {g["term"]: g for g in result.glossary}
    assert set(by_term) == {"Clé primaire", "Normalisation"}  # Hachage is not in the course
    assert by_term["Clé primaire"]["in_course"] is True
    assert "identifie" in by_term["Clé primaire"]["excerpt"]
    assert by_term["Normalisation"]["in_course"] is False
    assert "normalisation" in by_term["Normalisation"]["excerpt"].lower()


def test_grounding_matches_plurals_and_accents():
    from ai.grounding import ground_glossary

    text = "Les plis affectent les schistes. L'orogenèse hercynienne déforme la Meseta."
    out = ground_glossary([{"term": "Pli", "definition": "déformation des schistes"},
                           {"term": "Schiste", "definition": "roche affectée par les plis"},
                           {"term": "Orogénèse", "definition": "déforme la Meseta"}], text)
    assert [g["term"] for g in out] == ["Pli", "Schiste", "Orogénèse"]
    assert all(g["in_course"] for g in out)


def test_offline_glossary_is_marked_in_course(course_text):
    glossary = StudyAI(OfflineLLM(), HashingEmbedder()).analyze(course_text, {}, "x.pdf").glossary
    assert glossary and all(g["in_course"] is True and g["excerpt"] == "" for g in glossary)


def test_offline_faq_covers_topics_beyond_definitions(course_text):
    ai = StudyAI(OfflineLLM(), HashingEmbedder())
    faq = ai.analyze(course_text, {}, "x.pdf").faq
    questions = [f["question"] for f in faq]
    assert any(q.startswith("Que désigne") for q in questions)
    assert any(q.startswith("Que faut-il retenir sur") for q in questions)
    assert len(questions) == len(set(questions)) and all(f["answer"] for f in faq)
