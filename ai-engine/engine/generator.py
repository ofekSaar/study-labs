from typing import List
from engine.pydantic_models import Course, Lesson, Topic, Question

from llama_index.core.program import LLMTextCompletionProgram
from llama_index.llms.openai import OpenAI

import os
import asyncio
import logging
import random
from dotenv import load_dotenv
from llama_index.llms.gemini import Gemini
from llama_index.llms.openai import OpenAI

logger = logging.getLogger(__name__)
from engine.db import update_course_progress, save_syllabus_blueprint, get_syllabus_blueprint
from engine.semantic_filter import tag_materials_with_embeddings
from engine.llm_utils import run_with_fallback, run_with_fallback_sync
from engine.config import MAX_CONCURRENT_AI_CALLS

load_dotenv()

# ── Rate Limiting ────────────────────────────────────────
_api_semaphore = asyncio.Semaphore(MAX_CONCURRENT_AI_CALLS)

async def retry_with_backoff(coro_fn, max_retries=3, base_delay=2.0):
    """
    Retries an async function with exponential backoff + jitter.
    Specifically handles 429 rate limit errors.
    """
    for attempt in range(max_retries + 1):
        try:
            return await coro_fn()
        except Exception as e:
            error_str = str(e).lower()
            is_rate_limit = '429' in error_str or 'rate' in error_str or 'too many' in error_str
            
            if attempt == max_retries or not is_rate_limit:
                raise  # Out of retries or not a rate limit error
            
            delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
            logger.warning(f"Rate limited (attempt {attempt + 1}/{max_retries + 1}). Retrying in {delay:.1f}s...")
            await asyncio.sleep(delay)

# Initialize LLMs list in priority order
LLMS = []

if os.environ.get("OPENAI_API_KEY"):
    LLMS.append(("OpenAI", OpenAI(model="gpt-4o-mini", request_timeout=180.0, max_retries=3)))

if os.environ.get("COLLEGE_API_BASE"):
    try:
        import httpx
        _college_llm = OpenAI(
            model=os.environ.get("COLLEGE_MODEL", "gpt-oss-120b"),
            api_key=os.environ.get("COLLEGE_API_KEY", "college"),
            api_base=os.environ.get("COLLEGE_API_BASE"),
            request_timeout=180.0,
            http_client=httpx.Client(verify=False),
            async_http_client=httpx.AsyncClient(verify=False),
        )
        LLMS.append(("CollegeLLM", _college_llm))
        logger.info("CollegeLLM registered successfully.")
    except Exception as e:
        logger.warning(f"Failed to initialize CollegeLLM: {e}")

if os.environ.get("OPEN_ROUTE_API_KEY"):
    LLMS.append(("OpenRouter", OpenAI(
        model="gpt-4o",
        api_key=os.environ.get("OPEN_ROUTE_API_KEY"),
        api_base="https://openrouter.ai/api/v1"
    )))

if os.environ.get("GEMINI_API_KEY"):
    LLMS.append(("Gemini", Gemini(model="models/gemini-flash-latest", api_key=os.environ.get("GEMINI_API_KEY"))))
    
if not LLMS:
    logger.warning("No API Keys found. AI features will fail unless Mock Mode is active.")

def parse_syllabus(syllabus_text: str, syllabus_name: str = "Unknown") -> Course:
    """
    Parses raw syllabus text into a structured Course object.
    """
    # Check for MOCK mode to allow testing without valid API keys
    if os.environ.get("USE_MOCK_AI") == "True":
        logger.info(f"Using MOCK AI Mode for parsing syllabus: {syllabus_name}")
        return Course(
            title="Mock Course (Demo)", 
            lessons=[
                Lesson(
                    title="Lesson 1: Mock Basics", 
                    topics=[
                        Topic(
                            title="Topic 1.1: Mock Intro", 
                            description="This is a mock topic generated because USE_MOCK_AI is True.",
                            questions=[Question(question_text="Is this real?", options=["Yes", "No"], correct_answer=1)],
                            summary="# Mock Summary\n\nThis content is generated for demonstration purposes."
                        )
                    ]
                )
            ]
        )

    for provider_name, llm_instance in LLMS:
        try:
            logger.info(f"Attempting parse_syllabus for '{syllabus_name}' with {provider_name}...")
            program = LLMTextCompletionProgram.from_defaults(
                output_cls=Course,
                prompt_template_str="""
                Extract a highly detailed course structure from the following syllabus.
                Ensure you include all major lessons, topics under each lesson, and the description of what will be taught.

                IMPORTANT: Create UNIQUE and DESCRIPTIVE titles for each lesson and topic.
                - Lesson titles should be clear, concise, and specific (e.g., "Introduction to Python Basics", "Object-Oriented Programming Fundamentals")
                - Topic titles should be even more specific and describe the exact concept being taught (e.g., "Variables and Data Types", "List Comprehensions", "Class Inheritance")
                - Each title MUST be different and meaningful - avoid generic names like "Topic 1", "Lesson A", or repeating the same title
                - Use the actual concepts and terms from the syllabus content

                Do NOT generate summaries or questions at this stage.

                IMPORTANT: Always use Markdown for formatting. Use LaTeX for ALL mathematical formulas, variables, and state transitions (e.g., $E=mc^2$ or $q_0 \\rightarrow q_1$).

                Syllabus:
                {syllabus}
                """,
                llm=llm_instance,
                verbose=True
            )
            logger.info("Calling LLM to extract syllabus structure...")
            result = program(syllabus=syllabus_text)
            logger.info(f"Successfully parsed syllabus with {len(result.lessons)} lessons.")
            return result
        except Exception as e:
            logger.warning(f"[parse_syllabus] {provider_name} failed: {e}")
            continue

    logger.warning("All LLM providers failed for parse_syllabus.")
    return Course(title="Error Parsing Syllabus", lessons=[])

def tag_materials_to_topic(topic: Topic, materials: List[str]) -> List[str]:
    """
    Uses LLM to filter relevant materials for a given topic.
    """
    if not materials:
        return []

    # Simplified extraction for tagging
    from pydantic import BaseModel
    class MaterialMatches(BaseModel):
        relevant_indices: List[int]

    prompt_template_str = (
        "You are an assistant helping to map learning materials to course topics.\n"
        "Topic: {topic_title} - {topic_desc}\n"
        "Materials:\n"
        "{materials_list}\n"
        "Return the indices (0-based) of the materials that are relevant to this topic."
    )
    
    materials_text = "\n".join([f"[{i}] {m[:100]}..." for i, m in enumerate(materials)])
    
    for provider_name, llm_instance in LLMS:
        try:
            program = LLMTextCompletionProgram.from_defaults(
                output_cls=MaterialMatches,
                prompt_template_str=prompt_template_str,
                llm=llm_instance
            )
            result = program(topic_title=topic.title, topic_desc=topic.description or "", materials_list=materials_text)
            return [materials[i] for i in result.relevant_indices if i < len(materials)]
        except Exception as e:
            logger.warning(f"Error in tag_materials_to_topic with {provider_name}: {e}")
            continue

    return materials[:1] # Fallback: return first material

async def generate_content_for_topic(topic: Topic) -> tuple[List[Question], str]:
    """
    Generates questions and study summaries for the topic in a single LLM call.
    Uses semaphore for rate limiting and retry for 429 errors.
    """
    if os.environ.get("USE_MOCK_AI") == "True":
        logger.info(f"Using MOCK AI Mode for generate_content_for_topic: {topic.title}")
        questions = topic.questions if topic.questions else [Question(question_text="Is this real?", options=["Yes", "No"], correct_answer=1)]
        summary = topic.summary if topic.summary else f"# Summary for {topic.title}\n\nThis is a mock summary for {topic.title} generated because USE_MOCK_AI is True."
        return questions, summary

    from pydantic import BaseModel, Field
    class TopicContent(BaseModel):
        summary: str = Field(..., description="A concise but comprehensive study summary/card in Markdown format, covering key concepts, definitions, and points.")
        questions: List[Question] = Field(..., description="A list of exactly 3 multiple-choice questions testing key concepts of this topic.")

    matched_content = "\n".join(topic.matched_materials)
    
    prompt_template_str = (
        "You are an expert tutor creating a study guide and a quiz for a student.\n"
        "Topic: {topic_title}\n"
        "Description: {topic_desc}\n"
        "Material content:\n"
        "{matched_content}\n\n"
        "Please generate:\n"
        "1. A concise but comprehensive study summary in Markdown format.\n"
        "2. Exactly 3 multiple-choice questions based on the topic and materials.\n\n"
        "IMPORTANT: Always use LaTeX for mathematical formulas, variables, and state transitions. "
        "Use single dollar signs $...$ for inline math (e.g., $E=mc^2$ or $q_0 \\rightarrow q_1$) and double dollar signs $$...$$ for block equations. "
        "Do NOT use parentheses ( ) or plain text for math symbols.\n"
        "IMPORTANT: You must output strictly valid JSON conforming to the schema. "
        "Properly escape all internal quotes, backslashes, and newlines so the parser does not fail."
    )
    
    for provider_name, llm_instance in LLMS:
        try:
            program = LLMTextCompletionProgram.from_defaults(
                output_cls=TopicContent,
                prompt_template_str=prompt_template_str,
                llm=llm_instance
            )
            async def _call():
                async with _api_semaphore:
                    return await program.acall(
                        topic_title=topic.title,
                        topic_desc=topic.description or "",
                        matched_content=matched_content
                    )
            
            result = await retry_with_backoff(_call)
            return result.questions, result.summary
        except Exception as e:
            logger.warning(f"Error in generate_content_for_topic with {provider_name}: {e}")
            continue
            
    return [], f"# Summary for {topic.title}\n\n(Error generating summary)"


async def validate_question_alignment(summary: str, question: Question) -> bool:
    """
    Checks whether a quiz question is directly answerable from the given summary.
    Returns True if there is an alignment warning (i.e. question is NOT grounded in summary).
    """
    if os.environ.get("USE_MOCK_AI") == "True":
        return False

    from pydantic import BaseModel, Field as PField

    class AlignmentResult(BaseModel):
        aligned: bool = PField(..., description="True if the question is directly answerable from the summary")
        confidence: float = PField(..., description="Confidence score between 0 and 1")

    prompt_template_str = (
        "You are an educational content quality checker.\n"
        "Study Summary:\n{summary}\n\n"
        "Quiz Question: {question_text}\n\n"
        "Is this question directly answerable from the study summary above?\n"
        "Return 'aligned: true' only if the answer can be found in the summary. "
        "'confidence' should reflect how certain you are (0.0 to 1.0)."
    )

    for provider_name, llm_instance in LLMS:
        try:
            program = LLMTextCompletionProgram.from_defaults(
                output_cls=AlignmentResult,
                prompt_template_str=prompt_template_str,
                llm=llm_instance
            )
            async def _call():
                async with _api_semaphore:
                    return await program.acall(
                        summary=summary[:3000],
                        question_text=question.question_text
                    )
            result = await retry_with_backoff(_call)
            # Warning when not aligned or low confidence
            return not result.aligned or result.confidence < 0.6
        except Exception as e:
            logger.warning(f"validate_question_alignment failed with {provider_name}: {e}")
            continue

    return False  # Default: no warning on error


def sanitize_filename(name: str) -> str:
    """Sanitizes a string to be safe for filenames."""
    import re
    # Remove invalid characters
    s = re.sub(r'[\\/*?:"<>|]', "", name)
    # Replace spaces with underscores
    s = s.replace(" ", "_")
    return s[:50] # Limit length

async def create_course_pipeline(
    syllabus_text: str,
    materials: List[str],
    syllabus_name: str = "Unknown",
    materials_names: List[str] = None,
    course_id: str = None,
    is_update: bool = False,
    new_materials: List[str] = None
) -> tuple[Course, list]:
    """
    Orchestrates the course generation pipeline (Async Version).
    Supports initial parsing & tagging, as well as differential updates.
    Returns the course object and the list of updated topics.
    """
    if is_update:
        logger.info(f"Pipeline Step 1/3 (Update): Loading existing syllabus blueprint for course {course_id}")
        blueprint_doc = get_syllabus_blueprint(course_id)
        if not blueprint_doc:
            raise Exception(f"Syllabus blueprint not found for course {course_id}")
        course = Course.model_validate(blueprint_doc["blueprint"])
    else:
        # Step 1: Syllabus -> Structure
        logger.info("Pipeline Step 1/3: Parsing Syllabus")
        course = parse_syllabus(syllabus_text, syllabus_name=syllabus_name)

        # Persist syllabus blueprint as ground truth anchor
        if course_id:
            save_syllabus_blueprint(
                course_id=course_id,
                syllabus_name=syllabus_name,
                blueprint=course.model_dump()
            )
            logger.info(f"Syllabus blueprint saved for course {course_id}.")

    # Step 2: Tag Materials
    if is_update:
        logger.info(f"Pipeline Step 2/3 (Update): Mapping {len(new_materials)} new materials...")
        if course_id:
            update_course_progress(course_id, f"Mapping {len(new_materials)} new files to syllabus topics...")
        
        # Tag new materials
        tag_materials_with_embeddings(course, new_materials)
        
        # Identify which topics actually matched the new materials
        updated_topics = []
        for lesson in course.lessons:
            for topic in lesson.topics:
                if topic.matched_materials:  # Matched new files
                    topic.is_material_grounded = True
                    updated_topics.append(topic)
                    
        total_topics_to_gen = len(updated_topics)
        logger.info(f"Differential Update: {total_topics_to_gen} topics matched new materials and will be regenerated.")
    else:
        logger.info(f"Pipeline Step 2/3: Tagging {len(materials)} materials...")
        if course_id:
            update_course_progress(course_id, "Indexing materials for topic matching...")
            
        # Tag all materials using SBERT
        tag_materials_with_embeddings(course, materials)
        
        # In a new course, all topics are generated
        updated_topics = []
        for lesson in course.lessons:
            for topic in lesson.topics:
                updated_topics.append(topic)
        total_topics_to_gen = len(updated_topics)

    # Step 3: Generate Questions & Summaries (PARALLEL)
    if total_topics_to_gen > 0:
        logger.info(f"Pipeline Step 3/3: Generating content (questions & summaries) for {total_topics_to_gen} topics in PARALLEL...")
        
        tasks = []
        completed_topics = 0

        async def process_topic(lesson_title, t):
            nonlocal completed_topics
            logger.info(f"  → Generating content for: {lesson_title} / {t.title}")
            t.questions, t.summary = await generate_content_for_topic(t)
            # Validate alignment of each question against the generated summary
            if t.summary and t.questions:
                alignment_tasks = [validate_question_alignment(t.summary, q) for q in t.questions]
                warnings = await asyncio.gather(*alignment_tasks, return_exceptions=True)
                for q, warning in zip(t.questions, warnings):
                    q.alignment_warning = bool(warning) if not isinstance(warning, Exception) else False
            logger.info(f"  ✓ Finished: {lesson_title} / {t.title} ({len(t.questions)} questions)")
            completed_topics += 1
            if course_id:
                update_course_progress(course_id, f"Generating Content: Topic {completed_topics} of {total_topics_to_gen} completed...")

        for lesson in course.lessons:
            for topic in lesson.topics:
                if topic in updated_topics:
                    tasks.append(process_topic(lesson.title, topic))
                    
        await asyncio.gather(*tasks)
    else:
        logger.info("Differential Update: No topics matched the new materials. No content generation required.")

    logger.info("Pipeline COMPLETE.")
    return course, updated_topics

async def evaluate_answer(question: str, answer: str, aiPromptContext: str = None) -> dict:
    """
    Evaluates an open-ended answer using LLMs.
    """
    from pydantic import BaseModel
    class EvaluationResult(BaseModel):
        isCorrect: bool
        score: int
        feedback: str

    prompt_template_str = (
        "You are an expert tutor evaluating a student's answer.\n"
        "Question: {question}\n"
        "Student Answer: {answer}\n"
    )
    if aiPromptContext:
        prompt_template_str += f"Context/Expected Concepts: {aiPromptContext}\n"
        
    prompt_template_str += (
        "Evaluate the answer. Provide a boolean 'isCorrect' indicating if it passes the minimum bar. "
        "Provide a 'score' from 0 to 100. "
        "Provide detailed constructive 'feedback'. Use Markdown for formatting and LaTeX for all math ($...$)."
    )
    
    for provider_name, llm_instance in LLMS:
        try:
            program = LLMTextCompletionProgram.from_defaults(
                output_cls=EvaluationResult,
                prompt_template_str=prompt_template_str,
                llm=llm_instance
            )
            result = await program.acall(question=question, answer=answer)
            return {
                "isCorrect": result.isCorrect,
                "score": result.score,
                "feedback": result.feedback
            }
        except Exception as e:
            print(f"Error in evaluate_answer with {provider_name}: {e}")
            continue

    return {
        "isCorrect": len(answer) > 20,
        "score": 50 if len(answer) > 20 else 0,
        "feedback": "Evaluation failed due to LLM error. Automatic score based on length."
    }
