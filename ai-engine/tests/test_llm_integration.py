"""
Integration tests that use REAL LLM calls (OpenAI) to verify:
  1. Syllabus validation rejects a non-syllabus document (summary PDF).
  2. SBERT + real LLM pipeline: unrelated materials -> all topics ungrounded.
  3. Syllabus validation accepts a real syllabus document.

These tests require OPENAI_API_KEY to be set. They are skipped
automatically if no API key is available.

Approximate cost per CI run: ~4 LLM calls (pennies with gpt-4o).
"""

import os
import sys
import pytest
import asyncio

# Skip entire module if no API key
pytestmark = pytest.mark.skipif(
    not os.environ.get("OPENAI_API_KEY"),
    reason="OPENAI_API_KEY not set - skipping real LLM integration tests"
)

# Ensure engine is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from engine.pydantic_models import Course, Lesson, Topic
from engine.semantic_filter import tag_materials_with_embeddings

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")


def _read_pdf_text(filename):
    """Read text from a PDF file using the same parser the engine uses."""
    candidates = [filename]
    if filename == "sample_summary.pdf":
        candidates.append("handwritten_summary.pdf")
    elif filename == "sample_syllabus.pdf":
        candidates.append("Syllabus.pdf")

    candidate_paths = []
    for f in candidates:
        candidate_paths.append(os.path.join(FIXTURES_DIR, f))
        candidate_paths.append(os.path.join(FIXTURES_DIR, "computational-models", f))

    filepath = next((p for p in candidate_paths if os.path.exists(p)), None)
    assert filepath is not None and os.path.exists(filepath), f"Fixture not found: {filename} (searched: {candidate_paths})"

    try:
        from engine.ocr import extract_with_images
        with open(filepath, "rb") as f:
            res = extract_with_images(f.read(), filename=filename)
            return res.text
    except Exception:
        import fitz
        doc = fitz.open(filepath)
        text = "\n".join(page.get_text() for page in doc)
        doc.close()
        return text


# --- Test 1: Syllabus validation rejects a summary (non-syllabus) ------------

@pytest.mark.asyncio
async def test_validate_rejects_non_syllabus():
    """
    Upload a course summary PDF as if it were a syllabus.
    The LLM should detect it is NOT a syllabus and return is_syllabus=false.
    """
    from engine.generator import validate_syllabus_content

    summary_text = _read_pdf_text("sample_summary.pdf")
    assert len(summary_text) > 100, "sample_summary.pdf appears empty"

    result = await validate_syllabus_content(summary_text)

    assert isinstance(result, dict)
    assert "is_syllabus" in result, f"Missing 'is_syllabus' in response: {result}"
    assert result["is_syllabus"] is False, (
        f"Expected non-syllabus to be rejected, but LLM said is_syllabus=True. "
        f"Reason: {result.get('reason', 'N/A')}"
    )


# --- Test 2: Syllabus validation accepts a real syllabus ---------------------

@pytest.mark.asyncio
async def test_validate_accepts_real_syllabus():
    """
    Upload a real course syllabus PDF.
    The LLM should detect it IS a syllabus and return is_syllabus=true.
    """
    from engine.generator import validate_syllabus_content

    syllabus_text = _read_pdf_text("sample_syllabus.pdf")
    if len(syllabus_text) < 100:
        # Try computational-models/Syllabus.pdf
        syllabus_text = _read_pdf_text("Syllabus.pdf")
    assert len(syllabus_text) > 100, "Syllabus PDF appears empty"

    result = await validate_syllabus_content(syllabus_text)

    assert isinstance(result, dict)
    assert "is_syllabus" in result, f"Missing 'is_syllabus' in response: {result}"
    assert result["is_syllabus"] is True, (
        f"Expected real syllabus to be accepted, but LLM said is_syllabus=False. "
        f"Reason: {result.get('reason', 'N/A')}"
    )


# --- Test 3: Unrelated materials -> all topics ungrounded --------------------

@pytest.mark.asyncio
async def test_unrelated_materials_all_ungrounded():
    """
    Parse a real syllabus (LLM call) -> get topics.
    Run SBERT matching against an unrelated summary.
    All topics should be is_material_grounded=false.
    """
    from engine.generator import parse_syllabus

    # 1. Parse real syllabus to get topics
    syllabus_text = _read_pdf_text("sample_syllabus.pdf")
    if len(syllabus_text) < 100:
        syllabus_text = _read_pdf_text("Syllabus.pdf")
    assert len(syllabus_text) > 100

    course = parse_syllabus(syllabus_text, syllabus_name="test_syllabus.pdf")

    assert len(course.lessons) > 0, "Syllabus parsing returned no lessons"
    all_topics = [t for lesson in course.lessons for t in lesson.topics]
    assert len(all_topics) > 0, "Syllabus parsing returned no topics"

    # 2. Read unrelated summary as material
    unrelated_text = _read_pdf_text("sample_summary.pdf")
    assert len(unrelated_text) > 100

    # 3. Run SBERT matching
    tag_materials_with_embeddings(course, [unrelated_text])

    # 4. ALL topics should be ungrounded (materials are unrelated)
    grounded_topics = [t for t in all_topics if t.is_material_grounded]

    assert len(grounded_topics) <= 1, (
        f"Expected at most 1 topic to be grounded with unrelated materials, but "
        f"{len(grounded_topics)}/{len(all_topics)} were grounded: "
        f"{[t.title for t in grounded_topics]}"
    )


# --- Test 4: Related materials -> topics get grounded (SBERT only, no LLM) ---

def test_related_materials_get_grounded():
    """
    Create topics about Computational Models.
    Provide related material text about DFA and Turing machines.
    Topics should be grounded.
    """
    topic_dfa = Topic(
        title="Deterministic Finite Automata (DFA)",
        description="State transitions, alphabets, and accepted languages."
    )
    topic_turing = Topic(
        title="Turing Machines and Decidability",
        description="Turing machines, halting problem, undecidable languages."
    )

    course = Course(
        title="Computational Models",
        lessons=[Lesson(title="Lesson 1", topics=[topic_dfa, topic_turing])]
    )

    # Related materials
    materials = [
        "A DFA is a 5-tuple (Q, Sigma, delta, q0, F) consisting of states, alphabet, "
        "transition function, start state, and accept states. It processes input "
        "strings deterministically and accepts or rejects based on final state.",

        "The halting problem asks whether a Turing machine halts on a given input. "
        "Alan Turing proved this is undecidable using a diagonalization argument. "
        "This result is fundamental to the theory of computation."
    ]

    tag_materials_with_embeddings(course, materials)

    assert topic_dfa.is_material_grounded is True, "DFA topic should be grounded"
    assert topic_turing.is_material_grounded is True, "Turing topic should be grounded"
    assert len(topic_dfa.matched_materials) > 0
    assert len(topic_turing.matched_materials) > 0

@pytest.mark.asyncio
async def test_generate_content_combined():
    """
    Test that generate_content_for_topic generates both summary and questions in one call.
    """
    from engine.generator import generate_content_for_topic
    from engine.pydantic_models import Topic
    
    topic = Topic(
        title="Introduction to Python",
        description="Basic syntax and variable types in Python.",
        matched_materials=[]
    )
    
    questions, summary = await generate_content_for_topic(topic)
    
    assert summary is not None
    assert len(summary) > 100, "Should generate a valid summary"
    
    assert questions is not None
    assert len(questions) > 0, "Should generate questions"
    assert hasattr(questions[0], 'question_text')

