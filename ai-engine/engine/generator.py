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
from engine.db import (
    update_course_progress,
    save_syllabus_blueprint,
    get_syllabus_blueprint,
    get_db_handle,
    save_initial_course_to_db,
    save_topic_content_incremental,
)
from engine.semantic_filter import tag_materials_with_embeddings
from engine.llm_utils import run_with_fallback, run_with_fallback_sync
from engine.config import (
    MAX_CONCURRENT_AI_CALLS,
    USE_MOCK_AI,
    VALIDATE_QUESTION_ALIGNMENT,
    OPENAI_MODEL,
    OPENROUTER_MODEL,
    GEMINI_MODEL,
    COLLEGE_MODEL,
)

load_dotenv()

# ── Rate Limiting ────────────────────────────────────────
_api_semaphore = asyncio.Semaphore(MAX_CONCURRENT_AI_CALLS)


def _is_rate_limit_error(e: Exception) -> bool:
    """
    Detects 429 / rate-limit errors robustly, by HTTP status code and exception
    type first, falling back to specific marker phrases (not the bare substring
    'rate', which also matches 'generate'/'accurate').
    """
    status = getattr(e, "status_code", None) or getattr(e, "code", None)
    if status == 429:
        return True
    if type(e).__name__ in ("RateLimitError", "ResourceExhausted"):
        return True
    error_str = str(e).lower()
    markers = ("429", "rate limit", "too many requests", "quota", "resource_exhausted")
    return any(m in error_str for m in markers)


async def retry_with_backoff(coro_fn, max_retries=3, base_delay=2.0):
    """
    Retries an async function with exponential backoff + jitter.
    Specifically handles 429 rate limit errors.
    """
    for attempt in range(max_retries + 1):
        try:
            return await coro_fn()
        except Exception as e:
            if attempt == max_retries or not _is_rate_limit_error(e):
                raise  # Out of retries or not a rate limit error

            delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
            logger.warning(f"Rate limited (attempt {attempt + 1}/{max_retries + 1}). Retrying in {delay:.1f}s...")
            await asyncio.sleep(delay)

# Initialize LLMs list in priority order
LLMS = []

if os.environ.get("OPENAI_API_KEY"):
    LLMS.append(("OpenAI", OpenAI(model=OPENAI_MODEL, request_timeout=180.0, max_retries=3)))

if os.environ.get("COLLEGE_API_BASE"):
    try:
        import httpx
        _college_llm = OpenAI(
            model=COLLEGE_MODEL,
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
        model=OPENROUTER_MODEL,
        api_key=os.environ.get("OPEN_ROUTE_API_KEY"),
        api_base="https://openrouter.ai/api/v1"
    )))

if os.environ.get("GEMINI_API_KEY"):
    LLMS.append(("Gemini", Gemini(model=GEMINI_MODEL, api_key=os.environ.get("GEMINI_API_KEY"))))

if not LLMS:
    logger.warning("No API Keys found. AI features will fail unless Mock Mode is active.")

def parse_syllabus(syllabus_text: str, syllabus_name: str = "Unknown") -> Course:
    """
    Parses raw syllabus text into a structured Course object.
    """
    # Check for MOCK mode to allow testing without valid API keys
    if USE_MOCK_AI:
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

    prompt_template_str = """
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
                """

    def _try(provider_name, llm_instance):
        logger.info(f"Attempting parse_syllabus for '{syllabus_name}' with {provider_name}...")
        program = LLMTextCompletionProgram.from_defaults(
            output_cls=Course,
            prompt_template_str=prompt_template_str,
            llm=llm_instance,
            verbose=True
        )
        logger.info("Calling LLM to extract syllabus structure...")
        result = program(syllabus=syllabus_text)
        logger.info(f"Successfully parsed syllabus with {len(result.lessons)} lessons.")
        return result

    try:
        return run_with_fallback_sync(_try, op_name="parse_syllabus")
    except RuntimeError:
        logger.warning("All LLM providers failed for parse_syllabus.")
        return Course(title="Error Parsing Syllabus", lessons=[])

async def generate_content_for_topic(topic: Topic, course_title: str = None) -> tuple[List[Question], str]:
    """
    Generates questions and study summaries for the topic in a single LLM call.
    Uses semaphore for rate limiting and retry for 429 errors.
    """
    if USE_MOCK_AI:
        logger.info(f"Using MOCK AI Mode for generate_content_for_topic: {topic.title}")
        questions = topic.questions if topic.questions else [Question(question_text="Is this real?", options=["Yes", "No"], correct_answer=1)]
        summary = topic.summary if topic.summary else f"# Summary for {topic.title}\n\nThis is a mock summary for {topic.title} generated because USE_MOCK_AI is True."
        return questions, summary

    matched_content = "\n".join(topic.matched_materials)
    course_context = f"Course Context: {course_title}\n" if course_title else ""
    has_grounded_context = bool(topic.matched_materials) and topic.is_material_grounded
    context_block = f"Relevant course material text:\n{matched_content}\n" if matched_content else ""

    # 1. Generate Summary (Pure Markdown Output — no JSON escaping needed!)
    async def _try_summary(provider_name, llm_instance):
        async with _api_semaphore:
            prompt = (
                f"You are an expert tutor creating a comprehensive study guide for a student.\n"
                f"{course_context}"
                f"Topic: {topic.title}\n"
                f"Description: {topic.description or ''}\n"
                f"{context_block}\n"
                "Using the course material text above as your primary source, generate a detailed, "
                "rich, multi-paragraph study guide in Markdown format.\n"
                "Include:\n"
                "1. An Overview explaining the topic thoroughly based on the provided materials.\n"
                "2. Key Concepts & Definitions with bullet points.\n"
                "3. Theoretical / Mathematical Principles (use LaTeX $...$ for formulas if applicable).\n"
                "4. Practical Examples / Summary Takeaways.\n\n"
                "Respond with ONLY the Markdown study guide text (do NOT wrap in JSON)."
            )
            response = await llm_instance.acomplete(prompt)
            summary_text = response.text.strip()
            if summary_text.startswith("```markdown"):
                summary_text = summary_text.replace("```markdown", "", 1).rstrip("` \n")
            elif summary_text.startswith("```"):
                summary_text = summary_text.replace("```", "", 1).rstrip("` \n")
            return summary_text.strip()

    # 2. Generate Quiz Questions (Clean JSON array of 3 questions)
    async def _try_questions(provider_name, llm_instance):
        import re
        import json
        async with _api_semaphore:
            prompt = (
                f"You are an expert tutor creating a quiz for a student.\n"
                f"{course_context}"
                f"Topic: {topic.title}\n"
                f"Description: {topic.description or ''}\n"
                f"{context_block}\n"
                "Generate exactly 3 multiple-choice questions testing key concepts of this topic.\n\n"
                "Respond ONLY with a JSON array wrapped inside a ```json ... ``` block:\n"
                "[\n"
                "  {\n"
                '    "question_text": "...",\n'
                '    "options": ["A", "B", "C", "D"],\n'
                '    "correct_answer": 0\n'
                "  }\n"
                "]"
            )
            response = await llm_instance.acomplete(prompt)
            raw_text = response.text.strip()
            json_match = re.search(r"```json\s*(.*?)\s*```", raw_text, re.DOTALL)
            json_str = json_match.group(1) if json_match else raw_text
            repaired_json = re.sub(r'\\(?![\\"])', r'\\\\', json_str)
            raw_questions = json.loads(repaired_json)
            return [Question.parse_obj(q) for q in raw_questions]

    # Run Summary Generation
    try:
        summary = await run_with_fallback(_try_summary, op_name="generate_summary")
    except Exception as e:
        logger.warning(f"Failed to generate custom summary for '{topic.title}': {e}. Using structured fallback.")
        summary = (
            f"# Study Guide: {topic.title}\n\n"
            f"## Overview\n"
            f"This lesson covers theoretical foundations, definitions, and core principles of **{topic.title}** within the curriculum.\n\n"
            f"## Key Concepts\n"
            f"* **Definition**: Core properties and mathematical structure of {topic.title}.\n"
            f"* **Applications**: Main use cases and theoretical implications.\n"
            f"* **Formal Notations**: Standard mathematical and logical representations."
        )

    def _shuffle_question_options(q: Question) -> Question:
        import random
        if not q.options or len(q.options) < 2:
            return q
        correct_text = (
            q.options[q.correct_answer]
            if 0 <= q.correct_answer < len(q.options)
            else q.options[0]
        )
        
        shuffled = list(q.options)
        random.shuffle(shuffled)
        
        # Avoid biasing index 0: if correct_text ended up at index 0, swap it with a random non-zero index
        if len(shuffled) > 1 and shuffled[0] == correct_text:
            target_idx = random.randint(1, len(shuffled) - 1)
            shuffled[0], shuffled[target_idx] = shuffled[target_idx], shuffled[0]

        q.options = shuffled
        q.correct_answer = shuffled.index(correct_text)
        return q

    # Run Questions Generation
    try:
        raw_qs = await run_with_fallback(_try_questions, op_name="generate_questions")
        questions = [_shuffle_question_options(q) for q in raw_qs]
    except Exception as e:
        logger.warning(f"Failed to generate questions for '{topic.title}': {e}. Using fallback questions.")
        fallback_qs = [
            Question(
                question_text=f"What is the primary focus of {topic.title}?",
                options=[
                    f"Understanding key concepts of {topic.title}",
                    "Database query optimization",
                    "Operating system thread scheduling",
                    "Front-end layout styling"
                ],
                correct_answer=0
            ),
            Question(
                question_text=f"Which of the following is most relevant when studying {topic.title}?",
                options=[
                    "Theoretical computer science and formal models",
                    "Hardware wiring",
                    "Network cabling",
                    "Graphic design"
                ],
                correct_answer=0
            ),
            Question(
                question_text=f"True or False: {topic.title} is an essential component of this course curriculum.",
                options=["True", "False", "Neither", "Not applicable"],
                correct_answer=0
            )
        ]
        questions = [_shuffle_question_options(q) for q in fallback_qs]

    return questions, summary


async def validate_question_alignment(summary: str, question: Question) -> bool:
    """
    Checks whether a quiz question is directly answerable from the given summary.
    Returns True if there is an alignment warning (i.e. question is NOT grounded in summary).
    """
    if USE_MOCK_AI:
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

    async def _try(provider_name, llm_instance):
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
        return await retry_with_backoff(_call)

    try:
        result = await run_with_fallback(_try, op_name="validate_question_alignment")
        # Warning when not aligned or low confidence
        return not result.aligned or result.confidence < 0.6
    except RuntimeError:
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
        
        # Tag new materials (SBERT embedding is CPU-heavy — run off the event loop)
        await asyncio.to_thread(tag_materials_with_embeddings, course, new_materials)

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
            
        # Tag all materials using SBERT (CPU-heavy — run off the event loop)
        await asyncio.to_thread(tag_materials_with_embeddings, course, materials)

        # Pre-save initial course structure to DB to allow incremental generation
        if course_id:
            logger.info(f"Pre-saving initial course structure for course {course_id}...")
            await asyncio.to_thread(save_initial_course_to_db, course, course_id)

        # If course exists, load existing structure to identify already generated topics
        existing_structure = {}
        if course_id:
            try:
                db = get_db_handle()
                if db is not None:
                    from bson import ObjectId
                    course_doc = db['courses'].find_one({"_id": ObjectId(course_id)})
                    if course_doc and "course_structure" in course_doc:
                        existing_structure = course_doc["course_structure"]
            except Exception as db_err:
                logger.warning(f"Failed to fetch existing course structure for caching: {db_err}")

        # In a new course or retry, only generate topics that are missing or had errors
        updated_topics = []
        for lesson in course.lessons:
            for topic in lesson.topics:
                topic_entry = existing_structure.get(lesson.title, {}).get(topic.title, {})
                has_summary_id = topic_entry.get("summary_id")
                has_quiz_id = topic_entry.get("quiz_id")
                
                is_valid = False
                if has_summary_id and has_quiz_id:
                    try:
                        db = get_db_handle()
                        sum_doc = db['summaries'].find_one({"_id": ObjectId(has_summary_id)})
                        if sum_doc and sum_doc.get("content") and "(Error generating summary)" not in sum_doc.get("content"):
                            is_valid = True
                    except Exception:
                        pass
                
                if is_valid:
                    logger.info(f"Skipping generation for topic '{topic.title}' (already cached in DB)")
                    try:
                        db = get_db_handle()
                        sum_doc = db['summaries'].find_one({"_id": ObjectId(has_summary_id)})
                        quiz_doc = db['quizzes'].find_one({"_id": ObjectId(has_quiz_id)})
                        topic.summary = sum_doc.get("content") if sum_doc else None
                        topic.questions = quiz_doc.get("questions") if quiz_doc else []
                    except Exception as cache_err:
                        logger.error(f"Failed to load cached topic data for '{topic.title}': {cache_err}")
                        updated_topics.append(topic)
                else:
                    updated_topics.append(topic)

        total_topics_to_gen = len(updated_topics)

    # Step 3: Generate Questions & Summaries (PARALLEL)
    if total_topics_to_gen > 0:
        logger.info(f"Pipeline Step 3/3: Generating content (questions & summaries) for {total_topics_to_gen} topics...")
        
        tasks = []
        completed_topics = 0

        async def process_topic(lesson_title, t):
            nonlocal completed_topics
            logger.info(f"  → Generating content for: {lesson_title} / {t.title}")
            t.questions, t.summary = await generate_content_for_topic(t, course_title=course.title)
            
            # Validate alignment of each question against the generated summary.
            if VALIDATE_QUESTION_ALIGNMENT and t.summary and t.questions:
                alignment_tasks = [validate_question_alignment(t.summary, q) for q in t.questions]
                warnings = await asyncio.gather(*alignment_tasks, return_exceptions=True)
                for q, warning in zip(t.questions, warnings):
                    q.alignment_warning = bool(warning) if not isinstance(warning, Exception) else False
            
            # Save topic content incrementally
            if course_id:
                try:
                    await asyncio.to_thread(
                        save_topic_content_incremental,
                        course_id,
                        lesson_title,
                        t.title,
                        t.summary,
                        t.questions
                    )
                except Exception as save_err:
                    logger.error(f"Failed to save topic '{t.title}' incrementally: {save_err}")
            
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
        logger.info("Differential Update: All topics matched new materials and are cached. No content generation required.")

    logger.info("Pipeline COMPLETE.")
    return course, updated_topics

async def evaluate_answer(question: str, answer: str, aiPromptContext: str = None) -> dict:
    """
    Evaluates an open-ended answer using LLMs.
    """
    if USE_MOCK_AI:
        passed = len(answer) > 20
        return {
            "isCorrect": passed,
            "score": 80 if passed else 20,
            "feedback": "Mock evaluation (USE_MOCK_AI is True)."
        }

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

    async def _try(provider_name, llm_instance):
        program = LLMTextCompletionProgram.from_defaults(
            output_cls=EvaluationResult,
            prompt_template_str=prompt_template_str,
            llm=llm_instance
        )
        # Intentionally NOT gated by _api_semaphore: this is an interactive,
        # single-call endpoint (a student submitting an answer). Sharing the
        # bulk course-generation semaphore would queue it behind large jobs.
        return await retry_with_backoff(lambda: program.acall(question=question, answer=answer))

    try:
        result = await run_with_fallback(_try, op_name="evaluate_answer")
        return {
            "isCorrect": result.isCorrect,
            "score": result.score,
            "feedback": result.feedback
        }
    except RuntimeError:
        return {
            "isCorrect": len(answer) > 20,
            "score": 50 if len(answer) > 20 else 0,
            "feedback": "Evaluation failed due to LLM error. Automatic score based on length."
        }
