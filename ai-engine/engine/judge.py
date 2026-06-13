import json
import logging
from typing import Dict, Any
from pydantic import BaseModel, Field
from llama_index.core.program import LLMTextCompletionProgram
from engine.generator import LLMS, retry_with_backoff, _api_semaphore

logger = logging.getLogger(__name__)

class CourseEvaluation(BaseModel):
    score: int = Field(..., description="Overall score for the course out of 100")
    feedback: str = Field(..., description="Detailed constructive feedback explaining the score and any shortcomings")
    criteria_breakdown: Dict[str, Any] = Field(..., description="Breakdown of score by criteria: syllabus coverage, content quality, and question quality")

async def evaluate_course(course_structure: Dict, syllabus_text: str) -> Dict:
    """
    Evaluates a generated course structure against the original syllabus.
    """
    prompt_template_str = (
        "You are an expert AI educational judge evaluating a generated course.\n"
        "Please evaluate the generated course structure against the provided syllabus.\n\n"
        "Syllabus Content:\n"
        "{syllabus_text}\n\n"
        "Generated Course Structure:\n"
        "{course_structure_json}\n\n"
        "Evaluate based on the following criteria:\n"
        "1. Syllabus Coverage: Does the course cover the main topics mentioned in the syllabus?\n"
        "2. Content Quality: Are the lessons and summaries detailed, accurate, and educational?\n"
        "3. Question Quality: Are the quizzes relevant to the content and well-formulated?\n\n"
        "Provide an overall 'score' from 0 to 100, detailed 'feedback' explaining the rationale, "
        "and a 'criteria_breakdown' object with your observations for each of the 3 criteria.\n"
        "IMPORTANT: You must output strictly valid JSON. Properly escape all internal quotes, backslashes, and newlines so the parser does not fail."
    )
    
    course_json = json.dumps(course_structure, indent=2, ensure_ascii=False)
    # Truncate course_json if it's too large to avoid massive token usage
    if len(course_json) > 50000:
        course_json = course_json[:50000] + "\n...[TRUNCATED FOR EVALUATION]..."
        
    for provider_name, llm_instance in LLMS:
        try:
            program = LLMTextCompletionProgram.from_defaults(
                output_cls=CourseEvaluation,
                prompt_template_str=prompt_template_str,
                llm=llm_instance
            )
            async def _call():
                async with _api_semaphore:
                    return await program.acall(syllabus_text=syllabus_text, course_structure_json=course_json)
            
            logger.info(f"Evaluating course with {provider_name}...")
            result = await retry_with_backoff(_call)
            
            return {
                "score": result.score,
                "feedback": result.feedback,
                "criteria_breakdown": result.criteria_breakdown
            }
        except Exception as e:
            logger.warning(f"Error in evaluate_course with {provider_name}: {e}")
            continue
            
    return {
        "score": 0,
        "feedback": "Evaluation failed due to LLM errors.",
        "criteria_breakdown": {}
    }
