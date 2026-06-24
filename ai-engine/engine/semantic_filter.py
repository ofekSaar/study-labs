import logging
from functools import lru_cache
from typing import List
from engine.config import TOPIC_MATERIAL_THRESHOLD

logger = logging.getLogger(__name__)

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


def tag_materials_with_embeddings(course, materials: List[str]) -> None:
    """
    Tags materials to course topics in-place using cosine similarity.
    Calculates SBERT embeddings for topics and slide text chunks locally on CPU.
    Eliminates the N LLM calls in Step 2.
    """
    if not materials:
        # Mark all topics as ungrounded if there are no materials
        for lesson in course.lessons:
            for topic in lesson.topics:
                topic.matched_materials = []
                topic.is_material_grounded = False
        return

    # 1. Collect all topics in a flat list and keep references
    topics_flat = []
    topic_refs = []
    for lesson in course.lessons:
        for topic in lesson.topics:
            topics_flat.append(f"{topic.title}: {topic.description or ''}")
            topic_refs.append(topic)

    if not topics_flat:
        return

    # 2. Compute embeddings
    topic_embeddings = _embed(topics_flat)       # (n_topics, dim)
    material_embeddings = _embed(materials)      # (n_materials, dim)

    # 3. Calculate similarity matrix
    similarity_matrix = topic_embeddings @ material_embeddings.T  # (n_topics, n_materials)

    # 4. Map chunks above threshold to each topic (capping at top 15 most relevant)
    THRESHOLD = TOPIC_MATERIAL_THRESHOLD
    for t_idx, topic in enumerate(topic_refs):
        matched_with_scores = []
        for m_idx, mat_text in enumerate(materials):
            score = similarity_matrix[t_idx, m_idx]
            if score >= THRESHOLD:
                matched_with_scores.append((mat_text, score))
        
        # Sort by similarity score descending
        matched_with_scores.sort(key=lambda x: x[1], reverse=True)
        
        # Keep only the top 15 chunks
        top_matched = [item[0] for item in matched_with_scores[:15]]

        topic.matched_materials = top_matched
        topic.is_material_grounded = len(top_matched) > 0
        logger.info(f"SBERT Tagging: Topic '{topic.title}' matched with {len(top_matched)} chunks (total above threshold: {len(matched_with_scores)}). (Grounded: {topic.is_material_grounded})")
