import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from bson import ObjectId
from engine.pydantic_models import Course, Lesson, Topic, Question
from engine.generator import generate_content_for_topic, create_course_pipeline

@pytest.mark.asyncio
async def test_generate_content_for_topic_retries():
    # Create mock topic and run_with_fallback
    topic = Topic(title="Test DFA", description="DFA transitions")
    
    # We will patch 'engine.generator.run_with_fallback' to fail twice and succeed on 3rd attempt
    mock_run = AsyncMock()
    
    class FakeSummary:
        summary = "This is a valid summary for DFA"
    
    mock_run.side_effect = [
        "This is a valid summary for DFA",
        [Question(question_text="What is a DFA?", options=["A", "B"], correct_answer=0)]
    ]
    
    with patch("engine.generator.run_with_fallback", mock_run):
        questions, summary = await generate_content_for_topic(topic, "Course Title")
        
        assert mock_run.call_count == 2
        assert "valid summary" in summary
        assert len(questions) == 1

@pytest.mark.asyncio
async def test_create_course_pipeline_cache_skip():
    # Setup mock course
    topic_dfa = Topic(title="DFA", description="DFA theory")
    course = Course(
        title="Automata Course",
        lessons=[Lesson(title="Lesson 1", topics=[topic_dfa])]
    )
    
    # Mock DB handle queries
    mock_db = MagicMock()
    mock_courses_col = MagicMock()
    mock_summaries_col = MagicMock()
    mock_quizzes_col = MagicMock()
    
    mock_db.__getitem__.side_effect = lambda name: {
        'courses': mock_courses_col,
        'summaries': mock_summaries_col,
        'quizzes': mock_quizzes_col
    }[name]
    
    # Setup mock course document showing topic is already generated and cached
    fake_summary_id = ObjectId()
    fake_quiz_id = ObjectId()
    mock_courses_col.find_one.return_value = {
        "_id": ObjectId(),
        "title": "Automata Course",
        "course_structure": {
            "Lesson 1": {
                "DFA": {
                    "summary_id": str(fake_summary_id),
                    "quiz_id": str(fake_quiz_id),
                    "description": "DFA theory"
                }
            }
        }
    }
    
    # Setup mock summary document and quiz document
    mock_summaries_col.find_one.return_value = {
        "_id": fake_summary_id,
        "topic": "DFA",
        "content": "Valid cached summary of DFA"
    }
    mock_quizzes_col.find_one.return_value = {
        "_id": fake_quiz_id,
        "topic": "DFA",
        "questions": [{"question": "Q1", "options": ["A"], "answer": "A"}]
    }
    
    # Patch database handle, blueprint saver, parse_syllabus, and generators
    mock_gen = AsyncMock(return_value=([], "Cached summary"))
    with patch("engine.generator.get_db_handle", return_value=mock_db), \
         patch("engine.generator.save_syllabus_blueprint") as mock_save_bp, \
         patch("engine.generator.parse_syllabus", return_value=course), \
         patch("engine.generator.update_course_progress"), \
         patch("engine.db.update_course_progress"), \
         patch("engine.generator.tag_materials_with_embeddings") as mock_tag, \
         patch("engine.generator.save_initial_course_to_db") as mock_save_init, \
         patch("engine.generator.generate_content_for_topic", mock_gen):
         
        # Run pipeline
        res_course, updated_topics = await create_course_pipeline(
            "syllabus text",
            ["materials"],
            course_id=str(ObjectId())
        )
        
        # Verify that tag_materials_with_embeddings was run
        assert mock_tag.call_count == 1
        
        # Verify save_initial_course_to_db was run
        assert mock_save_init.call_count == 1
        
        # Verify generate_content_for_topic was SKIPPED because it was cached
        assert mock_gen.call_count == 0
        
        # Verify topic has the loaded cached data
        assert res_course.lessons[0].topics[0].summary == "Valid cached summary of DFA"
        assert len(res_course.lessons[0].topics[0].questions) == 1
