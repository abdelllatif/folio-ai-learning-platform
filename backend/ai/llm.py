"""LLM port and the Ollama adapter (Qwen2.5 by default)."""
import logging
import time
from typing import Protocol

import requests

logger = logging.getLogger("ai.llm")


class LLMUnavailable(Exception):
    """Raised when the model can't be reached; callers switch to extractive fallbacks."""


class LLMClient(Protocol):
    model_name: str

    def is_available(self) -> bool: ...

    def generate(self, prompt: str, system: str = "", json_mode: bool = False,
                 temperature: float = 0.2, max_tokens: int = 1500) -> str: ...

    def chat(self, messages: list[dict], temperature: float = 0.2,
             max_tokens: int = 900) -> str: ...


class OllamaClient:
    def __init__(self, base_url: str, model: str, timeout: int = 180):
        self.base_url = base_url.rstrip("/")
        self.model_name = model
        self.timeout = timeout
        self._available: tuple[float, bool] = (0.0, False)

    def is_available(self) -> bool:
        checked_at, ok = self._available
        if time.monotonic() - checked_at < 30:
            return ok
        try:
            res = requests.get(f"{self.base_url}/api/tags", timeout=2)
            names = {m.get("name", "") for m in res.json().get("models", [])}
            ok = res.ok and any(n == self.model_name or n.startswith(self.model_name + ":")
                                or self.model_name.startswith(n.split(":")[0]) for n in names)
        except (requests.RequestException, ValueError):
            ok = False
        self._available = (time.monotonic(), ok)
        return ok

    def _post(self, path: str, payload: dict) -> dict:
        try:
            res = requests.post(f"{self.base_url}{path}", json=payload, timeout=self.timeout)
            res.raise_for_status()
            return res.json()
        except requests.RequestException as exc:
            self._available = (time.monotonic(), False)
            raise LLMUnavailable(str(exc)) from exc

    def generate(self, prompt, system="", json_mode=False, temperature=0.2, max_tokens=1500):
        payload = {
            "model": self.model_name, "prompt": prompt, "system": system, "stream": False,
            "options": {"temperature": temperature, "num_predict": max_tokens, "num_ctx": 8192},
        }
        if json_mode:
            payload["format"] = "json"
        return self._post("/api/generate", payload).get("response", "").strip()

    def chat(self, messages, temperature=0.2, max_tokens=900):
        payload = {"model": self.model_name, "messages": messages, "stream": False,
                   "options": {"temperature": temperature, "num_predict": max_tokens,
                               "num_ctx": 8192}}
        return self._post("/api/chat", payload).get("message", {}).get("content", "").strip()
