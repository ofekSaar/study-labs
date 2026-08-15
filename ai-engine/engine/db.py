from pymongo import MongoClient
import os
import datetime
import logging
from engine.config import MONGO_CONNECTION_TIMEOUT_MS, TTL_STAGING_SECONDS
from bson import ObjectId

logger = logging.getLogger(__name__)

# Module-level singleton. pymongo's MongoClient is thread-safe and manages its
# own connection pool, so a single instance is reused across all calls instead
# of opening (and ping-checking) a fresh connection on every DB operation.
_client = None


def _utcnow():
    return datetime.datetime.now(datetime.timezone.utc)


def get_db_handle():
    """
    Returns a handle to the configured MongoDB database, reusing a single
    pooled client across calls.
    """
    global _client
    try:
        if _client is None:
            mongo_uri = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")
            _client = MongoClient(mongo_uri, serverSelectionTimeoutMS=MONGO_CONNECTION_TIMEOUT_MS)
        db_name = os.environ.get("MONGO_DB_NAME", "studylabs_db")
        return _client[db_name]
    except Exception as e:
        logger.error(f"Error connecting to MongoDB: {e}")
        return None

def save_course_to_db(course) -> dict:
    """
    Saves the generated course content to MongoDB across 3 collections:
    - 'quizzes': Stores topic questions
    - 'summaries': Stores topic summary text
    - 'courses': Stores the hierarchy and references to quiz/summary IDs
    
    Returns the inserted course document (including the generated _id).
    """
    db = get_db_handle()
    if db is None:
        raise Exception("Database connection failed")

    quizzes_col = db['quizzes']
    summaries_col = db['summaries']
    courses_col = db['courses']
    
    # We will build a structure mirror that contains the IDs
    # structure = { "Lesson Title": { "Topic Title": { "description": "...", "quiz_id": "...", "summary_id": "..." } } }
    structure = {}
    
    for lesson in course.lessons:
        structure[lesson.title] = {}
        for topic in lesson.topics:
            topic_entry = {
                "description": topic.description,
                "is_material_grounded": getattr(topic, "is_material_grounded", True)
            }
            
            # 1. Insert Quiz
            if topic.questions:
                quiz_doc = {
                    "topic": topic.title,
                    "questions": [q.model_dump() for q in topic.questions],
                    "created_at": _utcnow()
                }
                res = quizzes_col.insert_one(quiz_doc)
                topic_entry["quiz_id"] = str(res.inserted_id)
            
            # 2. Insert Summary
            if topic.summary:
                summary_doc = {
                    "topic": topic.title,
                    "content": topic.summary,
                    "created_at": _utcnow()
                }
                res = summaries_col.insert_one(summary_doc)
                topic_entry["summary_id"] = str(res.inserted_id)
                
            structure[lesson.title][topic.title] = topic_entry

    # 3. Insert Course
    course_doc = {
        "title": course.title,
        "created_at": _utcnow(),
        "course_structure": structure
    }
    
    res = courses_col.insert_one(course_doc)
    course_doc["_id"] = str(res.inserted_id) # Convert ObjectId to str for return
    return course_doc

def save_initial_course_to_db(course, course_id: str = None) -> dict:
    """
    Saves the initial course structure (lessons and topic titles) to MongoDB
    without summaries/quizzes yet. This permits incremental generation.
    """
    db = get_db_handle()
    if db is None:
        raise Exception("Database connection failed")

    courses_col = db['courses']
    
    # We will build a structure skeleton
    structure = {}
    for lesson in course.lessons:
        structure[lesson.title] = {}
        for topic in lesson.topics:
            structure[lesson.title][topic.title] = {
                "description": topic.description,
                "is_material_grounded": getattr(topic, "is_material_grounded", True)
            }

    course_doc = {
        "title": course.title,
        "created_at": _utcnow(),
        "course_structure": structure
    }

    if course_id:
        courses_col.update_one(
            {"_id": ObjectId(course_id)},
            {"$set": {
                "title": course.title,
                "course_structure": structure
            }},
            upsert=True
        )
        course_doc["_id"] = course_id
    else:
        res = courses_col.insert_one(course_doc)
        course_doc["_id"] = str(res.inserted_id)

    return course_doc

def save_topic_content_incremental(course_id: str, lesson_title: str, topic_title: str, summary_text: str, questions_list: list) -> dict:
    """
    Saves the summary and quiz for a single topic and updates the course document.
    """
    db = get_db_handle()
    if db is None:
        raise Exception("Database connection failed")

    quizzes_col = db['quizzes']
    summaries_col = db['summaries']
    courses_col = db['courses']

    # 1. Insert/Update Quiz
    quiz_id = None
    if questions_list:
        quiz_doc = {
            "topic": topic_title,
            "questions": [q.model_dump() if hasattr(q, "model_dump") else q for q in questions_list],
            "created_at": _utcnow()
        }
        # Check if already exists in existing course structure
        course_doc = courses_col.find_one({"_id": ObjectId(course_id)})
        existing_quiz_id = course_doc.get("course_structure", {}).get(lesson_title, {}).get(topic_title, {}).get("quiz_id") if course_doc else None
        
        if existing_quiz_id:
            quizzes_col.update_one({"_id": ObjectId(existing_quiz_id)}, {"$set": quiz_doc}, upsert=True)
            quiz_id = existing_quiz_id
        else:
            res = quizzes_col.insert_one(quiz_doc)
            quiz_id = str(res.inserted_id)

    # 2. Insert/Update Summary
    summary_id = None
    if summary_text:
        summary_doc = {
            "topic": topic_title,
            "content": summary_text,
            "created_at": _utcnow()
        }
        course_doc = courses_col.find_one({"_id": ObjectId(course_id)})
        existing_summary_id = course_doc.get("course_structure", {}).get(lesson_title, {}).get(topic_title, {}).get("summary_id") if course_doc else None
        
        if existing_summary_id:
            summaries_col.update_one({"_id": ObjectId(existing_summary_id)}, {"$set": summary_doc}, upsert=True)
            summary_id = existing_summary_id
        else:
            res = summaries_col.insert_one(summary_doc)
            summary_id = str(res.inserted_id)

    # 3. Update Course
    update_fields = {}
    if quiz_id:
        update_fields[f"course_structure.{lesson_title}.{topic_title}.quiz_id"] = quiz_id
    if summary_id:
        update_fields[f"course_structure.{lesson_title}.{topic_title}.summary_id"] = summary_id

    if update_fields:
        courses_col.update_one({"_id": ObjectId(course_id)}, {"$set": update_fields})

    return {"quiz_id": quiz_id, "summary_id": summary_id}

def ensure_ttl_index():
    """
    Ensures that the 'staging_materials' collection has a TTL index.
    Documents will be automatically deleted 24 hours (86400 seconds) after creation.
    """
    db = get_db_handle()
    if db is None:
        return
    
    collection = db['staging_materials']
    # Check if index exists, if not create it
    # 'created_at' field must be present in the document
    collection.create_index("created_at", expireAfterSeconds=TTL_STAGING_SECONDS)
    logger.info("TTL Index ensured for staging_materials (24h).")

def save_to_staging(filename: str, content: str) -> str:
    """
    Saves extracted text to the staging collection.
    Returns the ObjectId as a string.
    """
    db = get_db_handle()
    if db is None:
        return None
        
    doc = {
        "filename": filename,
        "content": content,
        "created_at": _utcnow(), 
        "hash": None # Start with None, implement robust hashing later if needed
    }
    
    res = db['staging_materials'].insert_one(doc)
    return str(res.inserted_id)

def check_file_hash(hash_val: str, course_id: str = None) -> bool:
    """
    Checks if a given SHA256 hash already exists for this course.

    Dedup is scoped per-course: the same file uploaded to two different courses
    (e.g. a shared textbook) is allowed. When course_id is None the check falls
    back to global behaviour for backward compatibility.
    """
    db = get_db_handle()
    if db is None:
        return False

    query = {"hash": hash_val}
    if course_id is not None:
        query["course_id"] = course_id
    doc = db['files'].find_one(query)
    return doc is not None

def save_file_hash(filename: str, hash_val: str, course_id: str = None):
    """
    Saves a file hash to the 'files' collection, scoped to a course.
    """
    db = get_db_handle()
    if db is None:
        return

    doc = {
        "filename": filename,
        "hash": hash_val,
        "course_id": course_id,
        "created_at": _utcnow()
    }
    db['files'].insert_one(doc)

def save_syllabus_blueprint(course_id: str, syllabus_name: str, blueprint: dict) -> str:
    """
    Persists the parsed syllabus Pydantic blueprint to the 'syllabus_blueprints' collection.
    Returns the inserted document's ObjectId as a string.
    """
    db = get_db_handle()
    if db is None:
        return None

    doc = {
        "course_id": course_id,
        "syllabus_name": syllabus_name,
        "blueprint": blueprint,
        "created_at": _utcnow()
    }
    res = db['syllabus_blueprints'].insert_one(doc)
    return str(res.inserted_id)

def get_syllabus_blueprint(course_id: str) -> dict:
    """
    Retrieves the syllabus Pydantic blueprint for a given course_id from the 'syllabus_blueprints' collection.
    """
    db = get_db_handle()
    if db is None:
        return None
    return db['syllabus_blueprints'].find_one({"course_id": course_id})

def update_course_progress(course_id: str, message: str):
    """
    Updates the generationProgress field in the course document.
    """
    db = get_db_handle()
    if db is None:
        return
    try:
        from bson.objectid import ObjectId
        db['courses'].update_one(
            {"_id": ObjectId(course_id)},
            {"$set": {"generationProgress": message}}
        )
    except Exception as e:
        logger.warning(f"Failed to update progress for course {course_id}: {e}")


def update_course_in_db(course_id: str, course, updated_topics: list) -> dict:
    """
    Updates only the affected topics' quizzes and summaries in MongoDB,
    re-using their existing IDs from the course structure.
    """
    db = get_db_handle()
    if db is None:
        raise Exception("Database connection failed")
        
    quizzes_col = db['quizzes']
    summaries_col = db['summaries']
    courses_col = db['courses']
    
    from bson.objectid import ObjectId

    # 1. Fetch the existing course document to find the quiz/summary IDs
    try:
        course_doc = courses_col.find_one({"_id": ObjectId(course_id)})
    except Exception:
        course_doc = courses_col.find_one({"_id": course_id})
        
    if not course_doc:
        return save_course_to_db(course)
        
    structure = course_doc.get("course_structure", {})
    
    # 2. Update each updated topic in the DB
    for topic in updated_topics:
        found = False
        for lesson_title, lesson_topics in structure.items():
            if topic.title in lesson_topics:
                topic_entry = lesson_topics[topic.title]
                quiz_id = topic_entry.get("quiz_id")
                summary_id = topic_entry.get("summary_id")
                
                topic_entry["is_material_grounded"] = topic.is_material_grounded
                
                if topic.questions:
                    quiz_data = {
                        "topic": topic.title,
                        "questions": [q.model_dump() for q in topic.questions],
                        "updated_at": _utcnow()
                    }
                    if quiz_id:
                        quizzes_col.update_one({"_id": ObjectId(quiz_id)}, {"$set": quiz_data})
                    else:
                        quiz_data["created_at"] = _utcnow()
                        res = quizzes_col.insert_one(quiz_data)
                        topic_entry["quiz_id"] = str(res.inserted_id)
                        
                if topic.summary:
                    summary_data = {
                        "topic": topic.title,
                        "content": topic.summary,
                        "updated_at": _utcnow()
                    }
                    if summary_id:
                        summaries_col.update_one({"_id": ObjectId(summary_id)}, {"$set": summary_data})
                    else:
                        summary_data["created_at"] = _utcnow()
                        res = summaries_col.insert_one(summary_data)
                        topic_entry["summary_id"] = str(res.inserted_id)
                        
                found = True
                break
        if not found:
            logger.warning(f"Topic '{topic.title}' was updated but not found in existing course structure.")
            
    # 3. Update the course document with the modified structure
    courses_col.update_one(
        {"_id": course_doc["_id"]},
        {"$set": {"course_structure": structure, "updated_at": _utcnow()}}
    )
    
    course_doc["course_structure"] = structure
    course_doc["_id"] = str(course_doc["_id"])
    return course_doc
