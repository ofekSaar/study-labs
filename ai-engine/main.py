from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from typing import List, Optional
from contextlib import asynccontextmanager
import os
import asyncio
import hashlib
from engine.db import get_db_handle, save_course_to_db, update_course_progress, save_to_staging, check_file_hash, save_file_hash, update_course_in_db, ensure_ttl_index
from engine.ocr import extract_text_from_bytes, extract_with_images, extract_in_chunks
from engine.parsers.image_analyzer import analyze_images
from engine.generator import create_course_pipeline, evaluate_answer
from engine.judge import evaluate_course
from bson import ObjectId
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure the staging_materials TTL index exists so extracted text is
    # auto-expired instead of accumulating forever.
    try:
        ensure_ttl_index()
    except Exception as e:
        logger.warning(f"Could not ensure TTL index on startup: {e}")
    yield


app = FastAPI(
    title="StudyLabs AI Engine API",
    description="FastAPI service for generating courses and evaluating answers.",
    version="1.0.0",
    lifespan=lifespan,
)

# --- Pydantic Models for Requests ---
class GenerateCourseRequest(BaseModel):
    courseId: str
    syllabusPath: str
    materialsPaths: List[str]
    analyzeImages: Optional[bool] = False
    isUpdate: Optional[bool] = False
    newMaterialsPaths: Optional[List[str]] = []

class EvaluateAnswerRequest(BaseModel):
    question: str
    answer: str
    aiPromptContext: Optional[str] = None

class EvaluateCourseRequest(BaseModel):
    courseId: str
    syllabusPath: str
    courseStructure: dict

# --- Endpoints ---

@app.get("/api/health/")
def health_check():
    return {"status": "ok"}

@app.get("/api/quizzes/{quiz_id}/")
def get_quiz(quiz_id: str):
    db = get_db_handle()
    if db is None:
        raise HTTPException(status_code=500, detail="DB connection failed")
    
    try:
        doc = db['quizzes'].find_one({"_id": ObjectId(quiz_id)})
        if not doc:
            raise HTTPException(status_code=404, detail="Quiz not found")
        
        doc["_id"] = str(doc["_id"])
        if "created_at" in doc:
            doc["created_at"] = doc["created_at"].isoformat()

        return doc
    except HTTPException:
        raise  # Preserve 404 (not found)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid ID or DB error: {str(e)}")

@app.get("/api/summaries/{summary_id}/")
def get_summary(summary_id: str):
    db = get_db_handle()
    if db is None:
        raise HTTPException(status_code=500, detail="DB connection failed")
    
    try:
        doc = db['summaries'].find_one({"_id": ObjectId(summary_id)})
        if not doc:
            raise HTTPException(status_code=404, detail="Summary not found")
        
        doc["_id"] = str(doc["_id"])
        if "created_at" in doc:
            doc["created_at"] = doc["created_at"].isoformat()

        return doc
    except HTTPException:
        raise  # Preserve 404 (not found)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid ID or DB error: {str(e)}")

def _parse_inputs(request: "GenerateCourseRequest") -> tuple[str, list, list]:
    """
    Synchronous, CPU/IO-heavy parsing of syllabus + material files.

    Reads files, computes per-course dedup hashes, runs the document parsers
    (PyMuPDF/Tesseract/etc.) and stages extracted text. Pure blocking work —
    called via asyncio.to_thread so it does not stall the event loop.

    Returns (syllabus_text, materials_text, all_images).
    Raises HTTPException(400) on duplicate files.
    """
    course_id = request.courseId
    syllabus_text = ""
    all_images = []

    # 1. Parse Syllabus (only if not an update)
    if not request.isUpdate:
        syllabus_name = os.path.basename(request.syllabusPath)
        logger.info(f"Parsing syllabus file: {request.syllabusPath}")
        update_course_progress(course_id, f"Parsing syllabus: {syllabus_name}...")
        with open(request.syllabusPath, "rb") as f:
            syllabus_bytes = f.read()

        syllabus_hash = hashlib.sha256(syllabus_bytes).hexdigest()
        if check_file_hash(syllabus_hash, course_id=course_id):
            logger.error("Duplicate syllabus file detected based on SHA256 hash.")
            raise HTTPException(status_code=400, detail="Duplicate syllabus file detected. Processing aborted.")
        save_file_hash(syllabus_name, syllabus_hash, course_id=course_id)

        syllabus_result = extract_with_images(syllabus_bytes, filename=syllabus_name)
        syllabus_text = syllabus_result.text
        all_images = list(syllabus_result.images)
        save_to_staging(syllabus_name, syllabus_text)
        logger.info(f"Syllabus parsed successfully. ({len(syllabus_result.images)} images found)")

    # 2. Parse Materials
    target_materials = request.newMaterialsPaths if request.isUpdate else request.materialsPaths
    logger.info(f"Parsing {len(target_materials)} course materials...")
    update_course_progress(course_id, f"Parsing {len(target_materials)} course materials...")
    materials_text = []
    for mat_path in target_materials:
        if not os.path.exists(mat_path):
            logger.warning(f"Material file not found, skipping: {mat_path}")
            continue
        mat_name = os.path.basename(mat_path)
        with open(mat_path, "rb") as f:
            mat_bytes = f.read()

        mat_hash = hashlib.sha256(mat_bytes).hexdigest()
        if check_file_hash(mat_hash, course_id=course_id):
            logger.error(f"Duplicate material file detected based on SHA256 hash: {mat_name}")
            raise HTTPException(status_code=400, detail=f"Duplicate material file detected: {mat_name}. Processing aborted.")
        save_file_hash(mat_name, mat_hash, course_id=course_id)

        chunk_generator = extract_in_chunks(mat_bytes, filename=mat_name, chunk_size=1)

        for chunk_idx, chunk_result in enumerate(chunk_generator):
            if chunk_result.text:
                materials_text.append(chunk_result.text)
                all_images.extend(chunk_result.images)

                chunk_filename = f"{mat_name}_part{chunk_idx + 1}"
                save_to_staging(chunk_filename, chunk_result.text)

    logger.info(f"Materials parsed successfully. ({len(all_images)} total images found)")
    return syllabus_text, materials_text, all_images


@app.post("/api/generate-course/")
async def generate_course(request: GenerateCourseRequest, req: Request):
    try:
        logger.info(f"Received request to generate course (isUpdate={request.isUpdate}): {request.courseId}")
        if not os.path.exists(request.syllabusPath):
            logger.error(f"Syllabus file not found: {request.syllabusPath}")
            raise HTTPException(status_code=400, detail=f"Syllabus file not found at path: {request.syllabusPath}")

        # 1 & 2. Read + parse all files off the event loop (blocking CPU/IO work)
        syllabus_text, materials_text, all_images = await asyncio.to_thread(_parse_inputs, request)

        # Validate syllabus content (skip for updates)
        if not request.isUpdate:
            from engine.generator import validate_syllabus_content
            validation = await validate_syllabus_content(syllabus_text)
            if not validation.get("is_syllabus", True):
                reason = validation.get("reason", "Unknown reason")
                logger.warning(f"Syllabus validation failed: {reason}")
                update_course_progress(request.courseId, f"Invalid syllabus: {reason}")
                raise HTTPException(
                    status_code=400,
                    detail=f"The uploaded file doesn't appear to be a course syllabus. {reason} Please upload a file containing course topics, schedule, or curriculum."
                )

        # 2.5. Analyze embedded images via Vision LLM (if enabled)
        if request.analyzeImages and all_images:
            logger.info(f"Image analysis enabled. Analyzing {len(all_images)} images...")
            update_course_progress(request.courseId, f"Analyzing {len(all_images)} embedded images with Vision AI...")
            image_descriptions = await analyze_images(all_images, context=syllabus_text[:500] if syllabus_text else "")
            if image_descriptions:
                image_section = "\n\n--- Embedded Image Descriptions ---\n" + "\n".join(image_descriptions)
                materials_text.append(image_section)
                logger.info(f"Added {len(image_descriptions)} image descriptions to materials")
        elif all_images:
            logger.info(f"Image analysis disabled. Skipping {len(all_images)} images.")
        
        logger.info("All parsing complete.")
        
        # 3. Run Pipeline
        logger.info("Starting AI pipeline...")
        syllabus_name = os.path.basename(request.syllabusPath)
        
        if request.isUpdate:
            course, updated_topics = await create_course_pipeline(
                syllabus_text="",
                materials=[],
                syllabus_name=syllabus_name,
                course_id=request.courseId,
                is_update=True,
                new_materials=materials_text
            )
            logger.info("AI pipeline finished differential update.")
            
            # 4. Save to DB (Update in place)
            logger.info("Updating course content in database...")
            update_course_progress(request.courseId, "Updating course in database...")
            course_doc = await asyncio.to_thread(update_course_in_db, request.courseId, course, updated_topics)
        else:
            materials_names = [os.path.basename(p) for p in request.materialsPaths if os.path.exists(p)]
            course, _ = await create_course_pipeline(
                syllabus_text, 
                materials_text, 
                syllabus_name=syllabus_name, 
                materials_names=materials_names, 
                course_id=request.courseId
            )
            logger.info("AI pipeline finished generating course structure.")
            
            # 4. Save to DB (Create new)
            logger.info("Saving generated course to database...")
            update_course_progress(request.courseId, "Saving course to database...")
            course_doc = await asyncio.to_thread(save_course_to_db, course)

        course_id_str = course_doc["_id"]
        db_structure = course_doc["course_structure"]
        
        # 5. Transform Routes — keep IDs for Node backend to fetch content directly
        base_url = str(req.base_url)
        def structure_to_routes(node):
            for key, value in node.items():
                if isinstance(value, dict):
                    if "quiz_id" in value or "summary_id" in value:
                         if "quiz_id" in value:
                             qid = value["quiz_id"]
                             value["quiz_route"] = f"{base_url}api/quizzes/{qid}/"
                         if "summary_id" in value:
                             sid = value["summary_id"]
                             value["summary_route"] = f"{base_url}api/summaries/{sid}/"
                    else:
                        structure_to_routes(value)

        structure_to_routes(db_structure)
        
        logger.info("Course payload successfully constructed and returned to Node backend.")
        return {
            "course_id": course_id_str,
            "course_structure": db_structure,
            "message": "Course generated successfully."
        }
    except HTTPException:
        raise  # Preserve intended 4xx status codes (e.g. duplicate file -> 400)
    except Exception as e:
        logger.error(f"Pipeline Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal Error: {str(e)}")

@app.post("/api/evaluate-answer/")
async def evaluate_answer_endpoint(request: EvaluateAnswerRequest):
    try:
        logger.info("Evaluating answer via AI...")
        result = await evaluate_answer(request.question, request.answer, request.aiPromptContext)
        logger.info("Evaluation complete.")
        return result
    except Exception as e:
        logger.error(f"Evaluation Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal Error: {str(e)}")

@app.post("/api/evaluate-course/")
async def evaluate_course_endpoint(request: EvaluateCourseRequest):
    try:
        logger.info(f"Received request to evaluate course: {request.courseId}")
        if not os.path.exists(request.syllabusPath):
            logger.error(f"Syllabus file not found for evaluation: {request.syllabusPath}")
            raise HTTPException(status_code=400, detail=f"Syllabus file not found at path: {request.syllabusPath}")
            
        def _read_syllabus():
            with open(request.syllabusPath, "rb") as f:
                syllabus_bytes = f.read()
            return extract_with_images(syllabus_bytes, filename=os.path.basename(request.syllabusPath)).text

        syllabus_text = await asyncio.to_thread(_read_syllabus)

        logger.info("Evaluating course structure via AI Judge...")
        result = await evaluate_course(request.courseStructure, syllabus_text)
        logger.info(f"Course evaluation complete. Score: {result.get('score')}")
        return result
    except HTTPException:
        raise  # Preserve 400 (syllabus not found)
    except Exception as e:
        logger.error(f"Course Evaluation Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal Error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
