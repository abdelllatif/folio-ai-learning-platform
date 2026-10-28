"""StudyAI — the application service of the AI layer.

Each public method tries the LLM first and degrades gracefully to the extractive
fallback, recording which path produced the result (``generated_by``).
"""
import logging
import re

import numpy as np

from . import fallback, prompts
from .embeddings import Embedder
from .jsonutil import parse_json_loose
from .llm import LLMClient, LLMUnavailable
from .retrieval import search
from .textproc import detect_language, extract_keywords, truncate
from .types import (
    Analysis,
    Answer,
    Citation,
    FlashcardDraft,
    QuestionDraft,
    ScoredChunk,
)

logger = logging.getLogger("ai.service")
CONTEXT_CHARS = 14000  # what we send to a 8k-token context window, with room to answer
MARKER = re.compile(r"\[(\d{1,2})\]")
CATEGORIES = {"Cours", "TD", "TP", "Examen", "Article", "Rapport", "Livre", "Autre"}


class StudyAI:
    def __init__(self, llm: LLMClient, embedder: Embedder, top_k: int = 5,
                 min_score: float | None = None):
        self.llm = llm
        self.embedder = embedder
        self.top_k = top_k
        # the right threshold depends on the embedding model's score distribution
        self.min_score = min(min_score, embedder.min_score) if min_score else embedder.min_score

    # ------------------------------------------------------------------ helpers
    def _llm_json(self, prompt: str, **kw):
        if not self.llm.is_available():
            raise LLMUnavailable("model offline")
        raw = self.llm.generate(prompt, system=prompts.SYSTEM_TUTOR, json_mode=True, **kw)
        return parse_json_loose(raw)

    def _condense(self, text: str, lang: str) -> str:
        """Map step of map-reduce: shrink long documents to fit the context window."""
        if len(text) <= CONTEXT_CHARS:
            return text
        n_parts = min(10, len(text) // 6000 + 1)
        size = len(text) // n_parts + 1
        parts = [text[i:i + size] for i in range(0, len(text), size)]
        summaries = []
        for part in parts:
            out = self.llm.generate(
                prompts.SECTION_SUMMARY.format(lang=prompts.lang_name(lang),
                                               text=part[:9000]),
                system=prompts.SYSTEM_TUTOR, max_tokens=400)
            summaries.append(out)
        return "\n\n".join(summaries)

    def embed(self, texts: list[str]) -> np.ndarray:
        return self.embedder.embed(texts)

    # ------------------------------------------------------------------ analysis
    def analyze(self, text: str, metadata: dict, filename: str,
                cover_lines: list[str] | None = None) -> Analysis:
        lang = detect_language(text)
        lang_label = prompts.lang_name(lang)
        try:
            if not self.llm.is_available():
                raise LLMUnavailable("model offline")
            condensed = self._condense(text, lang)
            data = self._llm_json(prompts.ANALYSIS.format(lang=lang_label, text=condensed),
                                  max_tokens=1800)
            explanation = self.llm.generate(
                prompts.EXPLANATION.format(lang=lang_label, text=condensed),
                system=prompts.SYSTEM_TUTOR, max_tokens=1800, temperature=0.3)
            aids = self._llm_json(prompts.STUDY_AIDS.format(lang=lang_label, text=condensed),
                                  max_tokens=1800)
            category = str(data.get("category", "Cours")).strip().capitalize()
            return Analysis(
                title=truncate(str(data.get("title") or "").strip(), 150)
                or fallback.guess_title(text, metadata, filename, cover_lines,
                                        extract_keywords(text, lang)),
                short_summary=str(data.get("short_summary", "")).strip(),
                summary=str(data.get("summary", "")).strip(),
                explanation=explanation,
                key_points=[str(p) for p in data.get("key_points", [])][:12],
                keywords=[str(k) for k in data.get("keywords", [])][:15]
                or extract_keywords(text, lang),
                glossary=[g for g in aids.get("glossary", [])
                          if isinstance(g, dict) and g.get("term") and g.get("definition")][:20],
                faq=[f for f in aids.get("faq", [])
                     if isinstance(f, dict) and f.get("question") and f.get("answer")][:12],
                subject=str(data.get("subject", "")).strip()[:80],
                level=str(data.get("level", "")).strip()[:40],
                category=category if category in CATEGORIES else "Autre",
                language=lang, generated_by="llm",
            )
        except (LLMUnavailable, ValueError, AttributeError) as exc:
            logger.info("Analysis falling back to extractive mode: %s", exc)
            return self._analyze_extractive(text, metadata, filename, lang, cover_lines)

    def _analyze_extractive(self, text, metadata, filename, lang, cover_lines=None) -> Analysis:
        summary = fallback.summarize(text, lang)
        points = fallback.key_points(text, lang)
        gloss = fallback.glossary(text)
        keywords = extract_keywords(text, lang)
        return Analysis(
            title=fallback.guess_title(text, metadata, filename, cover_lines, keywords),
            short_summary=truncate(summary.split("\n\n")[0], 320),
            summary=summary, key_points=points,
            explanation=fallback.explanation(summary, points, gloss, lang),
            keywords=keywords, glossary=gloss,
            faq=fallback.faq(gloss, points, lang),
            subject=metadata.get("subject", "")[:80], level="", category="Cours",
            language=lang, generated_by="extractive",
        )

    # ------------------------------------------------------------------ RAG
    def retrieve(self, question: str, matrix: np.ndarray, items: list[dict],
                 top_k: int | None = None) -> list[ScoredChunk]:
        qvec = self.embedder.embed([question])[0]
        return search(qvec, matrix, items, question, top_k=top_k or self.top_k,
                      min_score=self.min_score)

    def answer(self, question: str, matrix: np.ndarray, items: list[dict], lang: str = "fr",
               history: list[dict] | None = None) -> Answer:
        passages = self.retrieve(question, matrix, items)
        refusal = prompts.REFUSAL.get(lang, prompts.REFUSAL["fr"])
        if not passages:
            return Answer(text=refusal, citations=[], grounded=False, generated_by="none")

        context = "\n\n".join(
            f"[{i}] (p. {p.page_start}{'-' + str(p.page_end) if p.page_end != p.page_start else ''})"
            f" {p.text}" for i, p in enumerate(passages, start=1))
        try:
            if not self.llm.is_available():
                raise LLMUnavailable("model offline")
            messages = [{"role": "system", "content": prompts.RAG_SYSTEM.format(
                refusal=refusal, lang=prompts.lang_name(lang))}]
            for turn in (history or [])[-6:]:
                messages.append({"role": turn["role"], "content": truncate(turn["content"], 800)})
            messages.append({"role": "user", "content": prompts.RAG_USER.format(
                context=context, question=question)})
            text = self.llm.chat(messages)
            generated_by = "llm"
        except LLMUnavailable:
            text = fallback.answer_from_passages(passages, lang)
            generated_by = "extractive"

        used = sorted({int(m) for m in MARKER.findall(text) if 1 <= int(m) <= len(passages)})
        grounded = refusal.lower()[:30] not in text.lower()
        if grounded and not used:  # model forgot markers: cite the best passage
            used = [1]
        citations = [Citation(marker=i, ref=passages[i - 1].ref,
                              page_start=passages[i - 1].page_start,
                              page_end=passages[i - 1].page_end,
                              excerpt=truncate(passages[i - 1].text, 280),
                              score=passages[i - 1].score) for i in used] if grounded else []
        return Answer(text=text, citations=citations, grounded=grounded,
                      generated_by=generated_by,
                      follow_ups=self._follow_ups(question, text, lang) if grounded else [])

    def _follow_ups(self, question: str, answer: str, lang: str) -> list[str]:
        try:
            data = self._llm_json(prompts.FOLLOW_UPS.format(
                lang=prompts.lang_name(lang), question=question,
                answer=truncate(answer, 1200)), max_tokens=200)
            return [str(q) for q in data.get("questions", [])][:3]
        except (LLMUnavailable, ValueError, AttributeError):
            return []

    # ------------------------------------------------------------------ quizzes
    @staticmethod
    def _context(passages: list[ScoredChunk], limit: int = CONTEXT_CHARS) -> str:
        out, size = [], 0
        for p in passages:
            block = f"[p. {p.page_start}] {p.text}"
            if size + len(block) > limit:
                break
            out.append(block)
            size += len(block)
        return "\n\n".join(out)

    def generate_quiz(self, passages: list[ScoredChunk], n: int = 10,
                      difficulty: str = "moyen", kinds: list[str] | None = None,
                      lang: str = "fr") -> tuple[list[QuestionDraft], str]:
        kinds = kinds or ["mcq", "true_false"]
        try:
            data = self._llm_json(prompts.QUIZ.format(
                n=n, difficulty=difficulty, lang=prompts.lang_name(lang),
                types=", ".join(kinds), context=self._context(passages)),
                max_tokens=3500, temperature=0.4)
            drafts = [d for d in (self._to_question(q, kinds) for q in data.get("questions", []))
                      if d]
            if drafts:
                return drafts[:n], "llm"
        except (LLMUnavailable, ValueError, AttributeError) as exc:
            logger.info("Quiz falling back to extractive mode: %s", exc)
        return fallback.quiz_questions(passages, n, lang, kinds), "extractive"

    @staticmethod
    def _to_question(raw: dict, kinds: list[str]) -> QuestionDraft | None:
        if not isinstance(raw, dict):
            return None
        kind = raw.get("type", "mcq")
        choices = [str(c).strip() for c in raw.get("choices", []) if str(c).strip()]
        try:
            idx = int(raw.get("answer_index", -1))
        except (TypeError, ValueError):
            return None
        if kind not in kinds or not raw.get("question") or not 0 <= idx < len(choices):
            return None
        if kind == "mcq" and (len(choices) < 3 or len(set(c.lower() for c in choices))
                              != len(choices)):
            return None
        if kind == "true_false" and len(choices) != 2:
            return None
        page = raw.get("page")
        return QuestionDraft(kind=kind, prompt=str(raw["question"]).strip(), choices=choices,
                             answer_index=idx, explanation=str(raw.get("explanation", "")),
                             page=int(page) if str(page).isdigit() else None)

    # ------------------------------------------------------------------ flashcards
    def generate_flashcards(self, passages: list[ScoredChunk], n: int, lang: str,
                            glossary: list[dict], key_points: list[str]) \
            -> tuple[list[FlashcardDraft], str]:
        try:
            data = self._llm_json(prompts.FLASHCARDS.format(
                n=n, lang=prompts.lang_name(lang), context=self._context(passages)),
                max_tokens=2500, temperature=0.3)
            cards = []
            for c in data.get("cards", []):
                if isinstance(c, dict) and c.get("front") and c.get("back"):
                    page = c.get("page")
                    cards.append(FlashcardDraft(front=str(c["front"]).strip(),
                                                back=str(c["back"]).strip(),
                                                page=int(page) if str(page).isdigit() else None))
            if cards:
                return cards[:n], "llm"
        except (LLMUnavailable, ValueError, AttributeError) as exc:
            logger.info("Flashcards falling back to extractive mode: %s", exc)
        return fallback.flashcards(glossary, key_points, n), "extractive"
