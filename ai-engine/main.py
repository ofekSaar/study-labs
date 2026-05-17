from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from typing import List, Optional
import os
from engine.db import get_db_handle, save_course_to_db, update_course_progress, save_to_staging
from engine.ocr import extract_text_from_bytes, extract_with_images, extract_in_chunks
from engine.parsers.image_analyzer import analyze_images
from engine.generator import create_course_pipeline, evaluate_answer
from bson import ObjectId
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="StudyLabs AI Engine API",
    description="FastAPI service for generating courses and evaluating answers.",
    version="1.0.0"
)

# --- Pydantic Models for Requests ---
class GenerateCourseRequest(BaseModel):
    courseId: str
    syllabusPath: str
    materialsPaths: List[str]
    analyzeImages: Optional[bool] = False

class EvaluateAnswerRequest(BaseModel):
    question: str
    answer: str
    aiPromptContext: Optional[str] = None

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
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid ID or DB error: {str(e)}")

@app.post("/api/generate-course/")
async def generate_course(request: GenerateCourseRequest, req: Request):
    try:
        logger.info(f"Received request to generate course: {request.courseId}")
        if not os.path.exists(request.syllabusPath):
            logger.error(f"Syllabus file not found: {request.syllabusPath}")
            raise HTTPException(status_code=400, detail=f"Syllabus file not found at path: {request.syllabusPath}")
            
        # 1. Parse Syllabus
        logger.info(f"Parsing syllabus file: {request.syllabusPath}")
        update_course_progress(request.courseId, f"Parsing syllabus: {os.path.basename(request.syllabusPath)}...")
        with open(request.syllabusPath, "rb") as f:
            syllabus_bytes = f.read()
        syllabus_result = extract_with_images(syllabus_bytes, filename=os.path.basename(request.syllabusPath))
        syllabus_text = syllabus_result.text
        all_images = list(syllabus_result.images)
        save_to_staging(os.path.basename(request.syllabusPath), syllabus_text)
        logger.info(f"Syllabus parsed successfully. ({len(syllabus_result.images)} images found)")

        # 2. Parse Materials
        logger.info(f"Parsing {len(request.materialsPaths)} course materials...")
        update_course_progress(request.courseId, f"Parsing {len(request.materialsPaths)} course materials...")
        materials_text = []
        for mat_path in request.materialsPaths:
            if not os.path.exists(mat_path):
                 logger.warning(f"Material file not found, skipping: {mat_path}")
                 continue
            with open(mat_path, "rb") as f:
                 mat_bytes = f.read()
                 
            # Process in chunks (10 pages at a time) to prevent memory spikes
            chunk_generator = extract_in_chunks(mat_bytes, filename=os.path.basename(mat_path), chunk_size=10)
            
            for chunk_idx, chunk_result in enumerate(chunk_generator):
                if chunk_result.text:
                    materials_text.append(chunk_result.text)
                    all_images.extend(chunk_result.images)
                    
                    # Save each chunk to staging separately
                    chunk_filename = f"{os.path.basename(mat_path)}_part{chunk_idx + 1}"
                    save_to_staging(chunk_filename, chunk_result.text)
                    
        logger.info(f"Materials parsed successfully. ({len(all_images)} total images found)")

        # 2.5. Analyze embedded images via Vision LLM (if enabled)
        if request.analyzeImages and all_images:
            logger.info(f"Image analysis enabled. Analyzing {len(all_images)} images...")
            update_course_progress(request.courseId, f"Analyzing {len(all_images)} embedded images with Vision AI...")
            image_descriptions = await analyze_images(all_images, context=syllabus_text[:500])
            if image_descriptions:
                image_section = "\n\n--- Embedded Image Descriptions ---\n" + "\n".join(image_descriptions)
                materials_text.append(image_section)
                logger.info(f"Added {len(image_descriptions)} image descriptions to materials")
        elif all_images:
            logger.info(f"Image analysis disabled. Skipping {len(all_images)} images.")
        
        logger.info("All parsing complete.")
        
        # 3. Run Pipeline
        logger.info("Starting AI pipeline to generate course structure. This may take a few minutes...")
        update_course_progress(request.courseId, "Generating course blueprint from syllabus...")
        syllabus_name = os.path.basename(request.syllabusPath)
        materials_names = [os.path.basename(p) for p in request.materialsPaths if os.path.exists(p)]
        course, _ = await create_course_pipeline(syllabus_text, materials_text, syllabus_name=syllabus_name, materials_names=materials_names, course_id=request.courseId)
        logger.info("AI pipeline finished generating course structure.")
        
        # 4. Save to DB
        logger.info("Saving generated course to database...")
        update_course_progress(request.courseId, "Saving course to database...")
        course_doc = save_course_to_db(course)
        course_id_str = course_doc["_id"]
        db_structure = course_doc["course_structure"]
        
        # 5. Transform Routes — keep IDs for Node backend to fetch content directly
        base_url = str(req.base_url)
        def structure_to_routes(node):
            for key, value in node.items():
                if isinstance(value, dict):
                    if "quiz_id" in value or "summary_id" in value:
                         if "quiz_id" in value:
                             qid = value["quiz_id"]  # Keep the ID, don't pop
                             value["quiz_route"] = f"{base_url}api/quizzes/{qid}/"
                         if "summary_id" in value:
                             sid = value["summary_id"]  # Keep the ID, don't pop
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
