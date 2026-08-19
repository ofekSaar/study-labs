import json
import logging
from typing import Dict, Any
from pydantic import BaseModel, Field
from llama_index.core.program import LLMTextCompletionProgram
from engine.generator import retry_with_backoff, _api_semaphore
from engine.llm_utils import run_with_fallback

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
        "You are an expert AI educational judge evaluating a generated course against global educational standards.\n"
        "Please evaluate the generated course structure against the provided syllabus.\n\n"
        "Syllabus Content:\n"
        "{syllabus_text}\n\n"
        "Generated Course Structure:\n"
        "{course_structure_json}\n\n"
        "Evaluate strictly based on the following three standardized criteria:\n"
        "1. Syllabus Coverage & Depth (Educational): Does the course map logically to all topics in the syllabus? Verify if the summaries and quiz questions align with Bloom's Taxonomy standards (ranging from Remembering/Understanding to Applying/Analyzing). Quizzes must test not just basic terminology recall, but also real application of concepts.\n"
        "2. Logical Flow & Sequencing (Logical): Do the lessons progress from introductory concepts to advanced principles in a logical, step-by-step educational flow? Check if dependency topics are taught before complex topics.\n"
        "3. Material Grounding (Technological): Verify the 'is_material_grounded' flags on all topics. If a topic has 'is_material_grounded': false, it means the content was generated purely using the AI's general knowledge rather than slide sources. You must apply a grounding penalty to your overall score:\n"
        "   - If Grounded Topics >= 80%: No penalty.\n"
        "   - If Grounded Topics are between 50% and 79%: Apply a moderate penalty, capping the maximum overall score at 90.\n"
        "   - If Grounded Topics < 50%: Apply a heavy penalty, capping the maximum overall score at 75.\n\n"
        "Provide an overall 'score' from 0 to 100 adhering to these limits, detailed 'feedback' explaining your rationale (referencing Bloom's Taxonomy and grounding percentages), "
        "and a 'criteria_breakdown' object detailing observations for each of the three criteria.\n"
        "IMPORTANT: You must output strictly valid JSON. Properly escape all internal quotes, backslashes, and newlines so the parser does not fail."
    )
    
    course_json = json.dumps(course_structure, indent=2, ensure_ascii=False)
    # Truncate course_json if it's too large to avoid massive token usage
    if len(course_json) > 50000:
        course_json = course_json[:50000] + "\n...[TRUNCATED FOR EVALUATION]..."
        
    async def _try(provider_name, llm_instance):
        program = LLMTextCompletionProgram.from_defaults(
            output_cls=CourseEvaluation,
            prompt_template_str=prompt_template_str,
            llm=llm_instance
        )
        async def _call():
            async with _api_semaphore:
                return await program.acall(syllabus_text=syllabus_text, course_structure_json=course_json)

        logger.info(f"Evaluating course with {provider_name}...")
        return await retry_with_backoff(_call)

    try:
        result = await run_with_fallback(_try, op_name="evaluate_course")
        return {
            "score": result.score,
            "feedback": result.feedback,
            "criteria_breakdown": result.criteria_breakdown
        }
    except RuntimeError:
        return {
            "score": 0,
            "feedback": "Evaluation failed due to LLM errors.",
            "criteria_breakdown": {}
        }
