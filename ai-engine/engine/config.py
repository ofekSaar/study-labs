"""
Centralised configuration constants for the AI engine.

Override any value via environment variables where noted.
"""

import os

# ── Semantic Filtering ────────────────────────────────────────────────────────
SYLLABUS_SIMILARITY_THRESHOLD = 0.60   # minimum cosine similarity to keep a chunk
TOPIC_MATERIAL_THRESHOLD = 0.20        # exact mathematical sweet spot: >= 0.20 grounds real notes, < 0.20 rejects unrelated files

# ── MongoDB ───────────────────────────────────────────────────────────────────
MONGO_CONNECTION_TIMEOUT_MS = 5000     # serverSelectionTimeoutMS for MongoClient

# ── Staging collection TTL ────────────────────────────────────────────────────
TTL_STAGING_SECONDS = 86400            # 24 hours — auto-delete staging documents

# ── LLM concurrency ──────────────────────────────────────────────────────────
MAX_CONCURRENT_AI_CALLS = int(os.environ.get("MAX_CONCURRENT_AI_CALLS", "15"))

# ── Question/summary alignment check ──────────────────────────────────────────
# Each enabled topic fires one extra LLM call per question to flag questions not
# answerable from the summary. Disable to cut LLM cost/latency roughly in half.
VALIDATE_QUESTION_ALIGNMENT = os.environ.get(
    "VALIDATE_QUESTION_ALIGNMENT", "true"
).strip().lower() in ("true", "1", "yes")

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
