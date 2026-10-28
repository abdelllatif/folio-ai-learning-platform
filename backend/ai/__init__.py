"""Folio AI core — framework-free.

Nothing in this package imports Django. Ports (``Embedder``, ``LLMClient``) are
plain protocols, adapters are swappable, and every generator has an extractive
fallback so the platform keeps working when the local LLM is offline.
"""
