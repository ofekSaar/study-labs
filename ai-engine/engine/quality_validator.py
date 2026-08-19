"""
Content quality validation for generated summaries and quiz questions.

Runs format checks and SBERT-based semantic checks to catch:
- Too-short summaries
- Missing structure (headers, bullets)
- Off-topic content (SBERT coherence)
- Hallucinated content (SBERT grounding)
- Missing key concepts (keyword coverage)
- Misaligned quiz questions (SBERT alignment)

All checks are free (no LLM calls) — uses SBERT model already loaded in RAM.
"""

import re
import logging
from typing import List, Optional
from pydantic import BaseModel, Field

from engine.config import (
    MIN_SUMMARY_WORDS,
    MIN_SUMMARY_HEADERS,
    MIN_SUMMARY_BULLETS,
    SUMMARY_COHERENCE_THRESHOLD,
    SUMMARY_GROUNDING_THRESHOLD,
    KEYWORD_COVERAGE_THRESHOLD,
    QUESTION_ALIGNMENT_THRESHOLD,
)
from engine.semantic_filter import embed_texts

logger = logging.getLogger(__name__)


class QualityResult(BaseModel):
    """Result of quality validation for a single topic."""
    passed: bool = Field(..., description="Whether all checks passed")
    word_count: int = Field(0, description="Number of words in the summary")
    header_count: int = Field(0, description="Number of markdown headers found")
    bullet_count: int = Field(0, description="Number of bullet/list items found")
    failures: List[str] = Field(default_factory=list, description="List of failure reasons")
    quality_warning: bool = Field(False, description="True if passed but marginally")
    alignment_warnings: List[int] = Field(default_factory=list, description="Indices of questions with low alignment scores")


def validate_topic_quality(
    topic_title: str,
    topic_description: Optional[str],
    summary: str,
    questions: list,
    matched_materials: Optional[List[str]] = None,
    is_material_grounded: bool = False,
) -> QualityResult:
    """
    Validates a generated summary and quiz questions.
    Runs format checks first (fast), then SBERT checks if format passes.
    Returns QualityResult with pass/fail and specific failure reasons.
    """
    failures = []
    warnings_marginal = False

    # ── Format Checks (instant, free) ────────────────────────────────────────

    # 1. Word count
    word_count = len(summary.split()) if summary else 0
    if word_count < MIN_SUMMARY_WORDS:
        failures.append(f"word_count: {word_count} < {MIN_SUMMARY_WORDS} minimum")
    elif word_count < MIN_SUMMARY_WORDS * 1.2:  # marginally above threshold
        warnings_marginal = True

    # 2. Section headers (## or ###)
    header_count = len(re.findall(r'^#{2,3}\s+', summary, re.MULTILINE)) if summary else 0
    if header_count < MIN_SUMMARY_HEADERS:
        failures.append(f"headers: {header_count} < {MIN_SUMMARY_HEADERS} minimum")

    # 3. Bullet points (-, *, or numbered lists)
    bullet_count = len(re.findall(r'^\s*[-*]\s+|^\s*\d+\.\s+', summary, re.MULTILINE)) if summary else 0
    if bullet_count < MIN_SUMMARY_BULLETS:
        failures.append(f"bullets: {bullet_count} < {MIN_SUMMARY_BULLETS} minimum")

    # 4. Placeholder text detection
    placeholder_patterns = [r'\bTODO\b', r'\bTBD\b', r'\binsert here\b', r'\[\.\.\.]']
    for pat in placeholder_patterns:
        if summary and re.search(pat, summary, re.IGNORECASE):
            failures.append(f"placeholder_text: found '{pat}' in summary")
            break

    # 5. Paragraph repetition detection
    if summary:
        paragraphs = [p.strip() for p in summary.split('\n\n') if p.strip() and len(p.strip()) > 50]
        seen = set()
        for p in paragraphs:
            normalized = ' '.join(p.lower().split())
            if normalized in seen:
                failures.append("repetition: duplicate paragraph detected")
                break
            seen.add(normalized)

    # Short-circuit: if format checks already failed, skip expensive SBERT checks
    if failures:
        return QualityResult(
            passed=False,
            word_count=word_count,
            header_count=header_count,
            bullet_count=bullet_count,
            failures=failures,
            quality_warning=False,
            alignment_warnings=[],
        )

    # ── SBERT Content Checks (free, ~5ms each) ──────────────────────────────
    alignment_warning_indices = []

    try:
        # 6. Topic coherence — is the summary actually about this topic?
        topic_text = f"{topic_title}: {topic_description or ''}"
        embeddings = embed_texts([summary[:2000], topic_text])  # cap summary length for embedding
        coherence_score = float(embeddings[0] @ embeddings[1])
        if coherence_score < SUMMARY_COHERENCE_THRESHOLD:
            failures.append(f"coherence: {coherence_score:.3f} < {SUMMARY_COHERENCE_THRESHOLD} (summary may be off-topic)")
        elif coherence_score < SUMMARY_COHERENCE_THRESHOLD * 1.15:
            warnings_marginal = True

        # 7. Source grounding — does the summary use the uploaded materials?
        if is_material_grounded and matched_materials:
            material_embeddings = embed_texts([m[:1000] for m in matched_materials[:5]])  # top 5 chunks
            summary_embedding = embeddings[0]  # reuse from coherence check
            grounding_scores = summary_embedding @ material_embeddings.T
            best_grounding = float(grounding_scores.max())
            if best_grounding < SUMMARY_GROUNDING_THRESHOLD:
                failures.append(f"grounding: {best_grounding:.3f} < {SUMMARY_GROUNDING_THRESHOLD} (summary may not use uploaded materials)")

        # 8. Keyword coverage — does the summary mention key terms from the description?
        if topic_description:
            key_terms = _extract_key_terms(topic_description)
            if key_terms:
                summary_lower = summary.lower()
                covered = [t for t in key_terms if t.lower() in summary_lower]
                coverage = len(covered) / len(key_terms)
                if coverage < KEYWORD_COVERAGE_THRESHOLD:
                    missing = [t for t in key_terms if t.lower() not in summary_lower]
                    failures.append(f"keyword_coverage: {coverage:.0%} < {KEYWORD_COVERAGE_THRESHOLD:.0%} (missing: {', '.join(missing[:5])})")

        # 9. Quiz question alignment — is each question answerable from the summary?
        if questions:
            question_texts = [q.question_text if hasattr(q, 'question_text') else q.get('question_text', '') for q in questions]
            if question_texts:
                q_embeddings = embed_texts(question_texts)
                summary_embedding = embeddings[0]  # reuse
                for i, q_emb in enumerate(q_embeddings):
                    alignment_score = float(summary_embedding @ q_emb)
                    if alignment_score < QUESTION_ALIGNMENT_THRESHOLD:
                        alignment_warning_indices.append(i)

    except Exception as e:
        logger.warning(f"SBERT quality checks failed (proceeding without them): {e}")

    passed = len(failures) == 0
    return QualityResult(
        passed=passed,
        word_count=word_count,
        header_count=header_count,
        bullet_count=bullet_count,
        failures=failures,
        quality_warning=warnings_marginal and passed,
        alignment_warnings=alignment_warning_indices,
    )


def build_retry_feedback(quality_result: QualityResult) -> str:
    """
    Generates a human-readable feedback string from quality check failures.
    This is injected into the retry prompt to give the LLM specific guidance.
    """
    lines = ["Your previous response had the following quality issues:"]
    for failure in quality_result.failures:
        lines.append(f"- {failure}")
    lines.append("")
    lines.append("Please fix these issues in your new response.")

    if any('word_count' in f for f in quality_result.failures):
        lines.append("- Write MORE content. Expand each section with detailed explanations and examples.")
    if any('headers' in f for f in quality_result.failures):
        lines.append("- Include proper Markdown section headers (## Overview, ## Key Concepts, etc.)")
    if any('coherence' in f for f in quality_result.failures):
        lines.append("- Stay focused on the topic. Do not drift into unrelated subjects.")
    if any('grounding' in f for f in quality_result.failures):
        lines.append("- Use the provided course materials as your PRIMARY source. Reference specific concepts from them.")
    if any('keyword_coverage' in f for f in quality_result.failures):
        lines.append("- Make sure to cover ALL key concepts mentioned in the topic description.")

    return "\n".join(lines)


def _extract_key_terms(description: str) -> List[str]:
    """
    Extracts key terms from a topic description for keyword coverage checks.
    Returns terms of 3+ characters, excluding common stopwords.
    """
    if not description:
        return []
    
    # Split on common delimiters (commas, semicolons, 'and', Hebrew equivalents)
    tokens = re.findall(r'[a-zA-Z0-9א-ת]{3,}', description.lower())
    
    stopwords = {
        'the', 'and', 'for', 'with', 'this', 'that', 'from', 'are', 'was',
        'will', 'can', 'has', 'have', 'been', 'being', 'their', 'which',
        'about', 'into', 'through', 'during', 'before', 'after', 'above',
        'between', 'such', 'each', 'other', 'than', 'also', 'how', 'its',
        'של', 'על', 'עם', 'כל', 'את', 'מה', 'גם', 'הם', 'היא', 'הוא',
        'topic', 'topics', 'lesson', 'course', 'study', 'introduction',
    }
    
    return [t for t in tokens if t not in stopwords and len(t) >= 3]
