from typing import List
from engine.pydantic_models import Course, Lesson, Topic, Question

from llama_index.core.program import LLMTextCompletionProgram
# from llama_index.core.llms import MockLLM # REMOVED Mock logic
from llama_index.llms.openai import OpenAI

# Initialize LLM
# In production, use OpenAI(model="gpt-4") or similar robust model.
# Defaults to standard OpenAI setup if env var is set.
# Handles OpenRouter and Gemini as alternatives.
import os
import logging
from dotenv import load_dotenv
from llama_index.llms.gemini import Gemini
from llama_index.llms.openai import OpenAI

logger = logging.getLogger(__name__)

load_dotenv()

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
    LLMS.append(("OpenAI", OpenAI(model="gpt-5-nano")))
    
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
                Do NOT generate summaries or questions at this stage.

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
    )
    
    # Simulate async if library is sync-only, or assume LLM library has async methods
    # For LlamaIndex, `program.__call__` is sync. `program.acall` is async.
    
    for provider_name, llm_instance in LLMS:
        try:
            program = LLMTextCompletionProgram.from_defaults(
                output_cls=QuestionList,
                prompt_template_str=prompt_template_str,
                llm=llm_instance
            )
            # Use async call if available, otherwise wrap in sync_to_async or just run
            # Note: LlamaIndex `acall` takes kwargs.
            result = await program.acall(topic_title=topic.title, matched_content=matched_content)
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
    """
    from pydantic import BaseModel
    class SummaryResult(BaseModel):
        summary_markdown: str

    matched_content = "\n".join(topic.matched_materials)
    
    prompt_template_str = (
        "You are an expert tutor creating a study card/summary for a student.\n"
        "Topic: {topic_title}\n"
        "Description: {topic_desc}\n"
        "Material content:\n"
        "{matched_content}\n"
        "Generate a concise but comprehensive study summary in Markdown format. "
        "Include key concepts, definitions, and important points."
    )
    
    for provider_name, llm_instance in LLMS:
        try:
            program = LLMTextCompletionProgram.from_defaults(
                output_cls=SummaryResult,
                prompt_template_str=prompt_template_str,
                llm=llm_instance
            )
            result = await program.acall(topic_title=topic.title, topic_desc=topic.description or "", matched_content=matched_content)
            return result.summary_markdown
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



import asyncio

async def create_course_pipeline(syllabus_text: str, materials: List[str], syllabus_name: str = "Unknown", materials_names: List[str] = None) -> tuple[Course, dict]:
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
    else:
        logger.info("Pipeline Step 2/3: Tagging materials...")
    course = tag_materials(course, materials)
    
    # Step 3: Generate Questions & Summaries (PARALLEL)
    logger.info("Pipeline Step 3/3: Generating content (questions & summaries) in PARALLEL...")
    
    tasks = []
    
    async def process_topic(t):
        # Run both gen tasks for this topic
        q_task = generate_questions_for_topic(t)
        s_task = generate_summary_for_topic(t)
        t.questions, t.summary = await asyncio.gather(q_task, s_task)

    for lesson in course.lessons:
        for topic in lesson.topics:
            tasks.append(process_topic(topic))
            
    await asyncio.gather(*tasks)
    
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
        "Provide detailed constructive 'feedback'."
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
