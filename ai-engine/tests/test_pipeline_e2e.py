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
    
    # We patch validate_question_alignment's LLM completion program to return aligned vs unaligned results
    # Since validate_question_alignment calls run_with_fallback, we can patch run_with_fallback directly
    with patch("engine.generator.run_with_fallback") as mock_fallback:
        # Mocking first call (aligned) to return aligned=True, confidence=0.9
        # Mocking second call (unaligned) to return aligned=False, confidence=0.3
        class MockAlignmentResult:
            def __init__(self, aligned, confidence):
                self.aligned = aligned
                self.confidence = confidence
                
        mock_fallback.side_effect = [
            MockAlignmentResult(aligned=True, confidence=0.9),
            MockAlignmentResult(aligned=False, confidence=0.3)
        ]
        
        with patch("engine.generator.USE_MOCK_AI", False):
            warn_aligned = await validate_question_alignment(summary, aligned_q)
            warn_unaligned = await validate_question_alignment(summary, unaligned_q)
            
            # Aligned question should NOT have a warning
            assert warn_aligned is False
            # Unaligned question SHOULD have a warning
            assert warn_unaligned is True


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
