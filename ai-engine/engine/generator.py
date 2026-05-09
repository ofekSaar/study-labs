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
from engine.db import update_course_progress

load_dotenv()

# ── Rate Limiting ────────────────────────────────────────
# Max concurrent API calls to avoid 429 errors
MAX_CONCURRENT_CALLS = int(os.environ.get("MAX_CONCURRENT_AI_CALLS", "15"))
_api_semaphore = asyncio.Semaphore(MAX_CONCURRENT_CALLS)

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

if os.environ.get("OPEN_ROUTE_API_KEY"):
    LLMS.append(("OpenRouter", OpenAI(
        model="gpt-4o", 
        api_key=os.environ.get("OPEN_ROUTE_API_KEY"),
        api_base="https://openrouter.ai/api/v1"
    )))

if os.environ.get("GEMINI_API_KEY"):
    LLMS.append(("Gemini", Gemini(model="models/gemini-flash-latest", api_key=os.environ.get("GEMINI_API_KEY"))))

if os.environ.get("OPENAI_API_KEY"):
    LLMS.append(("OpenAI", OpenAI(model="gpt-4o-mini", request_timeout=180.0, max_retries=3)))
    
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
            logger.warning(f"Error with {provider_name}: {e}")
            continue # Try next provider

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

async def generate_questions_for_topic(topic: Topic) -> List[Question]:
    """
    Generates questions based on the topic and its matched materials.
    Uses semaphore for rate limiting and retry for 429 errors.
    """
    from pydantic import BaseModel
    class QuestionList(BaseModel):
        questions: List[Question]

    matched_content = "\n".join(topic.matched_materials)
    
    prompt_template_str = (
        "Generate 3 multiple-choice questions for the following topic and material.\n"
        "Topic: {topic_title}\n"
        "Material content:\n"
        "{matched_content}\n"
        "IMPORTANT: Always use LaTeX for mathematical formulas, variables, and state transitions. "
        "Use single dollar signs $...$ for inline math (e.g., $E=mc^2$ or $q_0 \\rightarrow q_1$) and double dollar signs $$...$$ for block equations. "
        "Do NOT use parentheses ( ) or plain text for math symbols. "
        "IMPORTANT: You must output strictly valid JSON. Properly escape all internal quotes, backslashes, and newlines so the parser does not fail."
    )
    
    for provider_name, llm_instance in LLMS:
        try:
            program = LLMTextCompletionProgram.from_defaults(
                output_cls=QuestionList,
                prompt_template_str=prompt_template_str,
                llm=llm_instance
            )
            async def _call():
                async with _api_semaphore:
                    return await program.acall(topic_title=topic.title, matched_content=matched_content)
            
            result = await retry_with_backoff(_call)
            return result.questions
        except Exception as e:
            logger.warning(f"Error in generate_questions_for_topic with {provider_name}: {e}")
            continue
            
    return []

def tag_materials(course: Course, materials: List[str]) -> Course:
    """
    Iterates through topics and adds relevant materials.
    Kept Sync for now as LlamaIndex tagging might be fast enough, or todo: make async too.
    """
    for lesson in course.lessons:
        for topic in lesson.topics:
            topic.matched_materials = tag_materials_to_topic(topic, materials)
    return course

def generate_questions(course: Course) -> Course:
    """
    Generates questions for each topic in the course.
    DEPRECATED in favor of async pipeline.
    """
    pass

async def generate_summary_for_topic(topic: Topic) -> str:
    """
    Generates a study summary (Markdown) for the topic based on matched materials.
    Uses semaphore for rate limiting and retry for 429 errors.
    """
    matched_content = "\n".join(topic.matched_materials)
    
    prompt = (
        "You are an expert tutor creating a study card/summary for a student.\n"
        f"Topic: {topic.title}\n"
        f"Description: {topic.description or ''}\n"
        "Material content:\n"
        f"{matched_content}\n"
        "Generate a concise but comprehensive study summary in Markdown format. "
        "Include key concepts, definitions, and important points. "
        "IMPORTANT: Always use LaTeX for mathematical formulas, variables, and state transitions. "
        "Use single dollar signs $...$ for inline math (e.g., $E=mc^2$ or $q_0 \\rightarrow q_1$) and double dollar signs $$...$$ for block equations. "
        "Do NOT use parentheses ( ) or plain text for math symbols."
    )
    
    for provider_name, llm_instance in LLMS:
        try:
            async def _call():
                async with _api_semaphore:
                    return await llm_instance.acomplete(prompt)
            
            response = await retry_with_backoff(_call)
            return response.text
        except Exception as e:
            logger.warning(f"Error in generate_summary_for_topic with {provider_name}: {e}")
            continue

    return f"# Summary for {topic.title}\n\n(Error generating summary)"


def sanitize_filename(name: str) -> str:
    """Sanitizes a string to be safe for filenames."""
    import re
    # Remove invalid characters
    s = re.sub(r'[\\/*?:"<>|]', "", name)
    # Replace spaces with underscores
    s = s.replace(" ", "_")
    return s[:50] # Limit length



# asyncio already imported at top

async def create_course_pipeline(syllabus_text: str, materials: List[str], syllabus_name: str = "Unknown", materials_names: List[str] = None, course_id: str = None) -> tuple[Course, dict]:
    """
    Orchestrates the course generation pipeline (Async Version).
    """
    # Step 1: Syllabus -> Structure (Sync LLM call for now, structure is sequence dependent)
    # We could make parse_syllabus async too, but let's focus on the heavy parallel part
    logger.info("Pipeline Step 1/3: Parsing Syllabus")
    # Wrap sync call if needed but parse_syllabus uses sync program() call.
    # ideally we update parse_syllabus to be async or run in executor.
    # For now, let's assume parse_syllabus remains sync but fast enough
    course = parse_syllabus(syllabus_text, syllabus_name=syllabus_name)
    
    # Step 2: Tag Materials (Sync for now)
    if materials_names:
        logger.info(f"Pipeline Step 2/3: Tagging {len(materials)} materials: {', '.join(materials_names)}")
        if course_id:
            update_course_progress(course_id, f"Indexing {len(materials)} materials for topic matching...")
    else:
        logger.info("Pipeline Step 2/3: Tagging materials...")
        if course_id:
            update_course_progress(course_id, "Indexing materials for topic matching...")
    course = tag_materials(course, materials)
    
    # Step 3: Generate Questions & Summaries (PARALLEL)
    total_topics = sum(len(lesson.topics) for lesson in course.lessons)
    logger.info(f"Pipeline Step 3/3: Generating content (questions & summaries) for {total_topics} topics in PARALLEL...")
    
    tasks = []
    
    completed_topics = 0

    async def process_topic(lesson_title, t):
        nonlocal completed_topics
        # Run both gen tasks for this topic
        logger.info(f"  → Generating content for: {lesson_title} / {t.title}")
        q_task = generate_questions_for_topic(t)
        s_task = generate_summary_for_topic(t)
        t.questions, t.summary = await asyncio.gather(q_task, s_task)
        logger.info(f"  ✓ Finished: {lesson_title} / {t.title} ({len(t.questions)} questions)")
        completed_topics += 1
        if course_id:
            update_course_progress(course_id, f"Generating Content: Topic {completed_topics} of {total_topics} completed...")

    for lesson in course.lessons:
        for topic in lesson.topics:
            tasks.append(process_topic(lesson.title, topic))
            
    await asyncio.gather(*tasks)
    
    logger.info(f"Pipeline COMPLETE. Generated content for {total_topics} topics across {len(course.lessons)} lessons.")
    
    return course, {}

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
