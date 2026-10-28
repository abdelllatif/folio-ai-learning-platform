"""Split pages into overlapping, sentence-aligned chunks that remember their pages."""
from .textproc import split_sentences
from .types import Chunk, Page


def chunk_pages(pages: list[Page], size: int = 900, overlap: int = 150) -> list[Chunk]:
    if overlap >= size:
        raise ValueError("overlap must be smaller than size")

    units: list[tuple[str, int]] = []  # (sentence, page)
    for page in pages:
        for sentence in split_sentences(page.text):
            # hard-split pathological "sentences" (tables, code) longer than a chunk
            while len(sentence) > size:
                units.append((sentence[:size], page.number))
                sentence = sentence[size - overlap:]
            units.append((sentence, page.number))

    chunks: list[Chunk] = []
    current: list[tuple[str, int]] = []
    length = 0

    def flush():
        text = " ".join(s for s, _ in current).strip()
        if text:
            chunks.append(Chunk(index=len(chunks), text=text,
                                page_start=current[0][1], page_end=current[-1][1]))

    for sentence, page_no in units:
        if current and length + len(sentence) + 1 > size:
            flush()
            # carry the tail sentences forward as overlap
            carry, carried = [], 0
            for s, p in reversed(current):
                if carried + len(s) > overlap:
                    break
                carry.insert(0, (s, p))
                carried += len(s) + 1
            current, length = carry, carried
        current.append((sentence, page_no))
        length += len(sentence) + 1
    if current:
        flush()
    return chunks
