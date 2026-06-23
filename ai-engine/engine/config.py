"""
Centralised configuration constants for the AI engine.

Override any value via environment variables where noted.
"""

import os

# ── Semantic Filtering ────────────────────────────────────────────────────────
SYLLABUS_SIMILARITY_THRESHOLD = 0.60   # minimum cosine similarity to keep a chunk
TOPIC_MATERIAL_THRESHOLD = 0.40        # minimum cosine similarity to assign a chunk to a topic

# ── MongoDB ───────────────────────────────────────────────────────────────────
MONGO_CONNECTION_TIMEOUT_MS = 5000     # serverSelectionTimeoutMS for MongoClient

# ── Staging collection TTL ────────────────────────────────────────────────────
TTL_STAGING_SECONDS = 86400            # 24 hours — auto-delete staging documents

# ── LLM concurrency ──────────────────────────────────────────────────────────
MAX_CONCURRENT_AI_CALLS = int(os.environ.get("MAX_CONCURRENT_AI_CALLS", "15"))

# ── Image analysis ───────────────────────────────────────────────────────────
MIN_IMAGE_SIZE = 5000                  # ~5 KB; images smaller than this are skipped
