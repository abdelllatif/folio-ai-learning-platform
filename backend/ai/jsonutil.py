"""Tolerant JSON parsing for LLM output (code fences, chatter around the payload)."""
import json
import re

FENCE = re.compile(r"```(?:json)?\s*(.*?)```", re.S)


def _balanced(text: str, opener: str, closer: str) -> str | None:
    start = text.find(opener)
    while start != -1:
        depth, in_str, esc = 0, False, False
        for i in range(start, len(text)):
            ch = text[i]
            if in_str:
                if esc:
                    esc = False
                elif ch == "\\":
                    esc = True
                elif ch == '"':
                    in_str = False
            elif ch == '"':
                in_str = True
            elif ch == opener:
                depth += 1
            elif ch == closer:
                depth -= 1
                if depth == 0:
                    return text[start:i + 1]
        start = text.find(opener, start + 1)
    return None


def parse_json_loose(text: str):
    """Return the first JSON object/array found in ``text`` or raise ``ValueError``."""
    if not text:
        raise ValueError("empty response")
    candidates = [m.group(1) for m in FENCE.finditer(text)] + [text]
    for cand in candidates:
        cand = cand.strip()
        try:
            return json.loads(cand)
        except json.JSONDecodeError:
            pass
        for opener, closer in (("{", "}"), ("[", "]")):
            block = _balanced(cand, opener, closer)
            if block:
                try:
                    return json.loads(block)
                except json.JSONDecodeError:
                    # trailing commas are the most common LLM JSON mistake
                    try:
                        return json.loads(re.sub(r",\s*([}\]])", r"\1", block))
                    except json.JSONDecodeError:
                        continue
    raise ValueError("no JSON found")
