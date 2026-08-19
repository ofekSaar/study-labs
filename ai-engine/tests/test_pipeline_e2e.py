import pytest
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock
from engine.pydantic_models import Course, Lesson, Topic, Question
from engine.semantic_filter import tag_materials_with_embeddings
from engine.generator import validate_question_alignment, evaluate_answer
from engine.judge import evaluate_course

def test_sbert_tagging_logic():
    # 1. Create a mock course
    topic_dfa = Topic(
        title="Deterministic Finite Automata",
        description="State transitions, alphabets, and accepted languages for DFA."
    )
    topic_turing = Topic(
        title="Turing Machines and Decidability",
        description="Turing machines, halting problem, and undecidable languages."
    )
    
    course = Course(
        title="Computational Models Test Course",
        lessons=[
            Lesson(
                title="Lesson 1",
                topics=[topic_dfa, topic_turing]
            )
        ]
    )
    
    # 2. Materials list
    materials = [
        "A DFA is a 5-tuple consisting of states, alphabet, transitions, start state, and accept states.",
        "The halting problem is undecidable, meaning no Turing machine can solve it for all inputs.",
        "How to bake a chocolate cake: mix flour, sugar, cocoa powder, and bake at 350 degrees."
    ]
    
    # Run tagging
    tag_materials_with_embeddings(course, materials)
    
    # 3. Assertions
    # Topic DFA should match the DFA text
    assert len(topic_dfa.matched_materials) > 0
    assert any("5-tuple" in m for m in topic_dfa.matched_materials)
    assert topic_dfa.is_material_grounded is True
    
    # Topic Turing should match the Turing text
    assert len(topic_turing.matched_materials) > 0
    assert any("halting problem" in m for m in topic_turing.matched_materials)
    assert topic_turing.is_material_grounded is True
    
    # Neither topic should match the chocolate cake recipe (similarity is too low)
    assert not any("chocolate cake" in m for m in topic_dfa.matched_materials)
    assert not any("chocolate cake" in m for m in topic_turing.matched_materials)


def test_hebrew_sbert_tagging_logic():
    # 1. Create a mock course in Hebrew
    topic_dfa = Topic(
        title="אוטומט סופי דטרמיניסטי (DFA)",
        description="מעברי מצבים, א'-ב' של שפה, ומילים מתקבלות באוטומט סופי דטרמיניסטי."
    )
    topic_turing = Topic(
        title="מכונות טיורינג ובעיית העצירה",
        description="מכונת טיורינג, כוח חישובי, ובעיית העצירה שאינה ניתנת להכרעה."
    )
    
    course = Course(
        title="קורס מודלים חישוביים",
        lessons=[
            Lesson(
                title="שיעור 1",
                topics=[topic_dfa, topic_turing]
            )
        ]
    )
    
    # 2. Materials in Hebrew
    materials = [
        "אוטומט סופי דטרמיניסטי מוגדר על ידי חמישייה הכוללת מצבים, אלפבית, פונקציית מעבר, מצב התחלתי ומצבים מקבלים.",
        "בעיית העצירה של מכונת טיורינג היא בעיה שאינה ניתנת להכרעה (אלגוריתמית), כפי שהוכיח אלן טיורינג.",
        "איך מכינים עוגת שוקולד חמה: מערבבים קמח, סוכר, קקאו, ביצים ואופים בתנור בחום בינוני."
    ]
    
    # Run tagging
    tag_materials_with_embeddings(course, materials)
    
    # 3. Assertions
    # Topic DFA should match the Hebrew DFA text
    assert len(topic_dfa.matched_materials) > 0
    assert any("חמישייה" in m for m in topic_dfa.matched_materials)
    assert topic_dfa.is_material_grounded is True
    
    # Topic Turing should match the Hebrew Turing text
    assert len(topic_turing.matched_materials) > 0
    assert any("להכרעה" in m for m in topic_turing.matched_materials)
    assert topic_turing.is_material_grounded is True
    
    # Neither topic should match the chocolate cake recipe (similarity is too low)
    assert not any("עוגת שוקולד" in m for m in topic_dfa.matched_materials)
    assert not any("עוגת שוקולד" in m for m in topic_turing.matched_materials)


@pytest.mark.asyncio
async def test_validate_question_alignment_warning():
    # Test step 10: question alignment validation
    from engine.quality_validator import validate_topic_quality
    
    summary = "A Deterministic Finite Automata (DFA) has a finite set of states and accepts or rejects strings."
    
    # Question directly answerable from summary
    aligned_q = Question(
        question_text="Does a DFA have a finite set of states?",
        options=["Yes", "No"],
        correct_answer=0
    )
    
    # Question NOT answerable from summary (about Turing Machines)
    unaligned_q = Question(
        question_text="What is the time complexity of a Turing Machine simulation?",
        options=["O(n)", "O(n^2)", "Undecidable"],
        correct_answer=1
    )
    
    with patch('engine.quality_validator.embed_texts') as mock_embed:
        import numpy as np
        # Summary (0), Topic (1), Aligned Q (2), Unaligned Q (3)
        mock_embed.return_value = np.array([
            [1.0, 0.0, 0.0],  # summary
            [0.95, 0.31, 0.0], # topic
            [1.0, 0.0, 0.0],  # aligned_q (cosine 1.0)
            [0.0, 1.0, 0.0],  # unaligned_q (cosine 0.0)
        ])
        
        # Test with aligned question only
        result_aligned = validate_topic_quality("Topic", "Desc", summary * 100, [aligned_q], None, False)
        # We just care about alignment warnings, ignore format failures if any
        
        # Test with unaligned question only
        result_unaligned = validate_topic_quality("Topic", "Desc", summary * 100, [unaligned_q], None, False)
        
        # The first question (aligned) shouldn't be in warnings
        assert 0 not in result_aligned.alignment_warnings
        # The unaligned question should be in warnings
        assert 0 in result_unaligned.alignment_warnings


@pytest.mark.asyncio
async def test_ai_judge_evaluation_mock():
    # Test step 11: AI Judge evaluation
    course_structure = {
        "title": "Computational Models",
        "lessons": []
    }
    syllabus_text = "This is the syllabus content."
    
    with patch("engine.judge.run_with_fallback") as mock_fallback:
        class MockEvaluation:
            def __init__(self, score, feedback, criteria_breakdown):
                self.score = score
                self.feedback = feedback
                self.criteria_breakdown = criteria_breakdown
                
        mock_fallback.return_value = MockEvaluation(
            score=85,
            feedback="Great course structure, maps well to Bloom's taxonomy.",
            criteria_breakdown={"syllabus_coverage": "Excellent", "grounding": "Grounded"}
        )
        
        res = await evaluate_course(course_structure, syllabus_text)
        assert res["score"] == 85
        assert "Bloom's taxonomy" in res["feedback"]
