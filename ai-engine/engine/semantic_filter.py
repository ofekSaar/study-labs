import logging
from functools import lru_cache
from typing import List

logger = logging.getLogger(__name__)

SIMILARITY_THRESHOLD = 0.60
_MODEL_NAME = "all-MiniLM-L6-v2"


@lru_cache(maxsize=1)
def _get_model():
    from sentence_transformers import SentenceTransformer
    logger.info(f"Loading sentence-transformer model: {_MODEL_NAME}")
    return SentenceTransformer(_MODEL_NAME)


def _embed(texts: List[str]):
    import numpy as np
    model = _get_model()
    return model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)


def filter_chunks_by_syllabus(chunks: List[str], syllabus_topics: List[str]) -> List[str]:
    """
    Keeps only chunks whose cosine similarity to any syllabus topic is >= 0.60.
    Uses all-MiniLM-L6-v2 running locally on CPU — no API key needed.
    """
    if not chunks or not syllabus_topics:
        return chunks

    import numpy as np

    topic_embeddings = _embed(syllabus_topics)   # (n_topics, dim)
    chunk_embeddings = _embed(chunks)             # (n_chunks, dim)

    # Cosine similarity matrix (embeddings are already L2-normalized)
    scores = chunk_embeddings @ topic_embeddings.T  # (n_chunks, n_topics)
    max_scores = scores.max(axis=1)                 # best topic match per chunk

    kept, dropped = [], 0
    for chunk, score in zip(chunks, max_scores):
        if score >= SIMILARITY_THRESHOLD:
            kept.append(chunk)
        else:
            dropped += 1
            logger.debug(f"Semantic filter: dropped chunk (score={score:.2f})")

    if dropped:
        logger.info(f"Semantic filter: kept {len(kept)}/{len(chunks)} chunks (dropped {dropped} below {SIMILARITY_THRESHOLD})")

    return kept
