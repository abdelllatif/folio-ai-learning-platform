from dataclasses import dataclass, field


@dataclass
class Page:
    number: int  # 1-based
    text: str
    ocr_used: bool = False


@dataclass
class ExtractedDocument:
    pages: list[Page]
    metadata: dict = field(default_factory=dict)

    @property
    def page_count(self) -> int:
        return len(self.pages)

    @property
    def full_text(self) -> str:
        return "\n\n".join(p.text for p in self.pages if p.text)

    @property
    def ocr_pages(self) -> int:
        return sum(1 for p in self.pages if p.ocr_used)


@dataclass
class Chunk:
    index: int
    text: str
    page_start: int
    page_end: int


@dataclass
class ScoredChunk:
    ref: object  # caller's identifier (DB id, index…)
    text: str
    page_start: int
    page_end: int
    score: float


@dataclass
class Citation:
    marker: int
    ref: object
    page_start: int
    page_end: int
    excerpt: str
    score: float

    def to_dict(self) -> dict:
        return {
            "marker": self.marker, "chunk": self.ref, "page_start": self.page_start,
            "page_end": self.page_end, "excerpt": self.excerpt, "score": round(self.score, 3),
        }


@dataclass
class Answer:
    text: str
    citations: list[Citation]
    grounded: bool
    generated_by: str  # "llm" | "extractive" | "none"
    follow_ups: list[str] = field(default_factory=list)


@dataclass
class QuestionDraft:
    kind: str  # "mcq" | "true_false"
    prompt: str
    choices: list[str]
    answer_index: int
    explanation: str = ""
    page: int | None = None


@dataclass
class FlashcardDraft:
    front: str
    back: str
    page: int | None = None


@dataclass
class Analysis:
    title: str
    short_summary: str
    summary: str
    explanation: str
    key_points: list[str]
    keywords: list[str]
    glossary: list[dict]  # [{"term", "definition"}]
    faq: list[dict]  # [{"question", "answer"}]
    subject: str
    level: str
    category: str
    language: str
    generated_by: str
