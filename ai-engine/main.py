from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from typing import List, Optional
import os
from engine.db import get_db_handle, save_course_to_db, save_to_staging
from engine.ocr import extract_text_from_bytes
from engine.generator import create_course_pipeline, evaluate_answer
from bson import ObjectId

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
        if not os.path.exists(request.syllabusPath):
            raise HTTPException(status_code=400, detail=f"Syllabus file not found at path: {request.syllabusPath}")
            
        # 1. Parse Syllabus
        with open(request.syllabusPath, "rb") as f:
            syllabus_bytes = f.read()
        syllabus_text = extract_text_from_bytes(syllabus_bytes, filename=os.path.basename(request.syllabusPath))
        save_to_staging(os.path.basename(request.syllabusPath), syllabus_text)

        # 2. Parse Materials
        materials_text = []
        for mat_path in request.materialsPaths:
            if not os.path.exists(mat_path):
                 continue
            with open(mat_path, "rb") as f:
                 mat_bytes = f.read()
            text = extract_text_from_bytes(mat_bytes, filename=os.path.basename(mat_path))
            if text:
                materials_text.append(text)
                save_to_staging(os.path.basename(mat_path), text)
        
        # 3. Run Pipeline
        course, _ = await create_course_pipeline(syllabus_text, materials_text)
        
        # 4. Save to DB
        course_doc = save_course_to_db(course)
        course_id_str = course_doc["_id"]
        db_structure = course_doc["course_structure"]
        
        # 5. Transform Routes
        base_url = str(req.base_url)
        def structure_to_routes(node):
            for key, value in node.items():
                if isinstance(value, dict):
                    if "quiz_id" in value or "summary_id" in value:
                         if "quiz_id" in value:
                             qid = value.pop("quiz_id")
                             value["quiz_route"] = f"{base_url}api/quizzes/{qid}/"
                         if "summary_id" in value:
                             sid = value.pop("summary_id")
                             value["summary_route"] = f"{base_url}api/summaries/{sid}/"
                    else:
                        structure_to_routes(value)

        structure_to_routes(db_structure)
        
        return {
            "course_id": course_id_str,
            "course_structure": db_structure,
            "message": "Course generated successfully."
        }
    except Exception as e:
        print(f"Pipeline Error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal Error: {str(e)}")

@app.post("/api/evaluate-answer/")
async def evaluate_answer_endpoint(request: EvaluateAnswerRequest):
    try:
        result = await evaluate_answer(request.question, request.answer, request.aiPromptContext)
        return result
    except Exception as e:
        print(f"Evaluation Error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal Error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
