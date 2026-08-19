"""
Tests for engine.semantic_filter.tag_materials_with_embeddings.

The SBERT model is never loaded — we monkeypatch the `embed_texts` function
with deterministic unit vectors so the cosine-similarity math is exercised
without downloading models or importing torch.
"""

from types import SimpleNamespace

import numpy as np
import pytest

import engine.semantic_filter as sf
from engine.config import TOPIC_MATERIAL_THRESHOLD


def _make_course():
    topic_a = SimpleNamespace(title="Topic A", description="", matched_materials=[], is_material_grounded=False)
    topic_b = SimpleNamespace(title="Topic B", description="", matched_materials=[], is_material_grounded=False)
    lesson = SimpleNamespace(title="Lesson 1", topics=[topic_a, topic_b])
    course = SimpleNamespace(lessons=[lesson])
    return course, topic_a, topic_b


def _fake_embed(texts):
    """Map known strings to orthogonal/near unit vectors."""
    table = {
        "Topic A": [1.0, 0.0],
        "Topic B": [0.0, 1.0],
        "mat_a": [1.0, 0.0],   # cosine 1.0 with Topic A
        "mat_b": [0.0, 1.0],   # cosine 1.0 with Topic B
        "mat_far": [0.2, 0.2], # cosine 0.2 with both — below threshold
    }
    vecs = []
    for t in texts:
        key = next((k for k in table if t.startswith(k)), None)
        vecs.append(table.get(key, [0.0, 0.0]))
    return np.array(vecs, dtype=float)


def test_tagging_assigns_relevant_materials(monkeypatch):
    # mat_far's cosine (0.2) must sit below the configured threshold for the
    # "dropped" assertion below to be meaningful.
    assert TOPIC_MATERIAL_THRESHOLD > 0.2
    monkeypatch.setattr(sf, "embed_texts", _fake_embed)
    course, topic_a, topic_b = _make_course()

    sf.tag_materials_with_embeddings(course, ["mat_a", "mat_b", "mat_far"])

    # Each topic keeps only its strongly-matching material; mat_far is dropped.
    assert topic_a.matched_materials == ["mat_a"]
    assert topic_b.matched_materials == ["mat_b"]
    assert topic_a.is_material_grounded is True
    assert topic_b.is_material_grounded is True


def test_no_materials_marks_all_ungrounded(monkeypatch):
    monkeypatch.setattr(sf, "embed_texts", _fake_embed)
    course, topic_a, topic_b = _make_course()

    sf.tag_materials_with_embeddings(course, [])

    assert topic_a.matched_materials == []
    assert topic_b.matched_materials == []
    assert topic_a.is_material_grounded is False
    assert topic_b.is_material_grounded is False


def test_matches_are_capped_at_15(monkeypatch):
    # 20 identical-to-Topic-A materials should be truncated to the top 15.
    monkeypatch.setattr(sf, "embed_texts", lambda texts: np.array(
        [[1.0, 0.0]] * len(texts), dtype=float))
    course, topic_a, _ = _make_course()

    sf.tag_materials_with_embeddings(course, [f"m{i}" for i in range(20)])

    assert len(topic_a.matched_materials) == 15
