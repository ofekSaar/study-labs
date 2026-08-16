import logging
import re
from functools import lru_cache
from typing import List
from engine.config import TOPIC_MATERIAL_THRESHOLD

logger = logging.getLogger(__name__)

_MODEL_NAME = "paraphrase-multilingual-MiniLM-L12-v2"

GENERIC_HEADER_PATTERNS = [
    r'מבוא\s+(ל[א-ת]+|לה[א-ת]+)?',
    r'מדעי\s+המחשב',
    r'מדע\s+הנתונים',
    r'המכללה\s+למינהל',
    r'הרצאה\s+\d+',
    r'תרגול\s+\d+',
    r'שנת\s+תשפ"[א-ת]',
    r'introduction\s+to\s+',
    r'computer\s+science',
]


@lru_cache(maxsize=1)
def _get_model():
    from sentence_transformers import SentenceTransformer
    logger.info(f"Loading sentence-transformer model: {_MODEL_NAME}")
    return SentenceTransformer(_MODEL_NAME)


def _embed(texts: List[str]):
    import numpy as np
    model = _get_model()
    return model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)


def _clean_text_for_embedding(text: str) -> str:
    """Strips generic course header noise to prevent spurious baseline similarity."""
    cleaned = text
    for pat in GENERIC_HEADER_PATTERNS:
        cleaned = re.sub(pat, ' ', cleaned, flags=re.IGNORECASE)
    return cleaned.strip()


def _extract_subject_terms(title: str, description: str = "") -> set:
    """Extracts subject-specific tokens (>= 3 chars, ignoring common stopwords)."""
    text = f"{title} {description or ''}"
    tokens = re.findall(r'[a-zA-Z0-9א-ת]{3,}', text.lower())
    stopwords = {
        'מבוא', 'לשפות', 'בשפות', 'של', 'על', 'עם', 'כל', 'את', 'מה', 'גם',
        'נושא', 'שיעור', 'פרק', 'קורס', 'לימוד', 'מטרות', 'תיאור', 'תוצרי',
        'introduction', 'chapter', 'lesson', 'topic', 'course', 'study'
    }
    return {t for t in tokens if t not in stopwords}


def tag_materials_with_embeddings(course, materials: List[str]) -> None:
    """
    Tags materials to course topics in-place using cosine similarity and subject term verification.
    Calculates SBERT embeddings for topics and slide text chunks locally on CPU.
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

    # 2. Clean texts for embedding to avoid generic header matching
    cleaned_topics = [_clean_text_for_embedding(t) for t in topics_flat]
    cleaned_materials = [_clean_text_for_embedding(m) for m in materials]

    # 3. Compute embeddings
    topic_embeddings = _embed(cleaned_topics)       # (n_topics, dim)
    material_embeddings = _embed(cleaned_materials)  # (n_materials, dim)

    # 4. Calculate similarity matrix
    similarity_matrix = topic_embeddings @ material_embeddings.T  # (n_topics, n_materials)

    # 5. Map chunks above threshold to each topic (capping at top 15 most relevant)
    THRESHOLD = TOPIC_MATERIAL_THRESHOLD
    for t_idx, topic in enumerate(topic_refs):
        subject_terms = _extract_subject_terms(topic.title, getattr(topic, 'description', ''))
        matched_with_scores = []
        for m_idx, mat_text in enumerate(materials):
            score = similarity_matrix[t_idx, m_idx]
            if score >= THRESHOLD:
                # Term verification: accept if score is very high (>= 0.40) OR chunk contains at least 1 subject term
                chunk_lower = mat_text.lower()
                has_term_overlap = any(term in chunk_lower for term in subject_terms) if subject_terms else True
                if score >= 0.40 or has_term_overlap:
                    matched_with_scores.append((mat_text, score))
        
        # Sort by similarity score descending
        matched_with_scores.sort(key=lambda x: x[1], reverse=True)
        
        # Keep only the top 15 chunks
        top_matched = [item[0] for item in matched_with_scores[:15]]

        topic.matched_materials = top_matched
        topic.is_material_grounded = len(top_matched) > 0
        logger.info(f"SBERT Tagging: Topic '{topic.title}' matched with {len(top_matched)} chunks (total above threshold: {len(matched_with_scores)}). (Grounded: {topic.is_material_grounded})")
