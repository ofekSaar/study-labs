"""
Centralised configuration constants for the AI engine.

Override any value via environment variables where noted.
"""

import os

# ── Semantic Filtering ────────────────────────────────────────────────────────
TOPIC_MATERIAL_THRESHOLD = float(os.environ.get('TOPIC_MATERIAL_THRESHOLD', '0.28'))        # calibrated threshold: 0.28 grounds real course notes while rejecting unrelated academic material (can be overridden via env vars)

# ── MongoDB ───────────────────────────────────────────────────────────────────
MONGO_CONNECTION_TIMEOUT_MS = 5000     # serverSelectionTimeoutMS for MongoClient

# ── Staging collection TTL ────────────────────────────────────────────────────
TTL_STAGING_SECONDS = 86400            # 24 hours — auto-delete staging documents

# ── LLM concurrency ──────────────────────────────────────────────────────────
MAX_CONCURRENT_AI_CALLS = int(os.environ.get("MAX_CONCURRENT_AI_CALLS", "15"))

# ── Content quality validation ────────────────────────────────────────────────
# Per-topic quality checks run after LLM generation using SBERT (free, no LLM calls).
MIN_SUMMARY_WORDS = int(os.environ.get('MIN_SUMMARY_WORDS', '500'))
MIN_SUMMARY_HEADERS = int(os.environ.get('MIN_SUMMARY_HEADERS', '3'))
MIN_SUMMARY_BULLETS = int(os.environ.get('MIN_SUMMARY_BULLETS', '5'))
SUMMARY_COHERENCE_THRESHOLD = float(os.environ.get('SUMMARY_COHERENCE_THRESHOLD', '0.45'))
SUMMARY_GROUNDING_THRESHOLD = float(os.environ.get('SUMMARY_GROUNDING_THRESHOLD', '0.35'))
KEYWORD_COVERAGE_THRESHOLD = float(os.environ.get('KEYWORD_COVERAGE_THRESHOLD', '0.60'))
QUESTION_ALIGNMENT_THRESHOLD = float(os.environ.get('QUESTION_ALIGNMENT_THRESHOLD', '0.35'))
MAX_QUALITY_RETRIES = int(os.environ.get('MAX_QUALITY_RETRIES', '2'))

# ── Mock mode ─────────────────────────────────────────────────────────────────
# Single source of truth for "is the AI mocked?" — accepts True/true/1/yes.
USE_MOCK_AI = os.environ.get("USE_MOCK_AI", "").strip().lower() in ("true", "1", "yes")

# ── Model names (override via env) ────────────────────────────────────────────
OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o")
OPENROUTER_MODEL = os.environ.get("OPENROUTER_MODEL", "gpt-4o")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "models/gemini-flash-latest")
COLLEGE_MODEL = os.environ.get("COLLEGE_MODEL", "gpt-oss-120b")
VISION_MODEL = os.environ.get("VISION_MODEL", "gpt-4o")

# ── Image analysis ───────────────────────────────────────────────────────────
MIN_IMAGE_SIZE = 5000                  # ~5 KB; images smaller than this are skipped
