from pymongo import MongoClient
import os
import datetime

def get_db_handle():
    """
    Returns a handle to the configured MongoDB database.
    """
    try:
        mongo_uri = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")
        db_name = os.environ.get("MONGO_DB_NAME", "studylabs_db")
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
        # Trigger a connection check
        client.server_info()
        db = client[db_name]
        return db
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
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
            topic_entry = {"description": topic.description}
            
            # 1. Insert Quiz
            if topic.questions:
                quiz_doc = {
                    "topic": topic.title,
                    "questions": [q.model_dump() for q in topic.questions],
                    "created_at": datetime.datetime.now()
                }
                res = quizzes_col.insert_one(quiz_doc)
                topic_entry["quiz_id"] = str(res.inserted_id)
            
            # 2. Insert Summary
            if topic.summary:
                summary_doc = {
                    "topic": topic.title,
                    "content": topic.summary,
                    "created_at": datetime.datetime.now()
                }
                res = summaries_col.insert_one(summary_doc)
                topic_entry["summary_id"] = str(res.inserted_id)
                
            structure[lesson.title][topic.title] = topic_entry

    # 3. Insert Course
    course_doc = {
        "title": course.title,
        "created_at": datetime.datetime.now(),
        "course_structure": structure
    }
    
    res = courses_col.insert_one(course_doc)
    course_doc["_id"] = str(res.inserted_id) # Convert ObjectId to str for return
    return course_doc

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
    collection.create_index("created_at", expireAfterSeconds=86400)
    print("TTL Index ensured for staging_materials (24h).")

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
        "created_at": datetime.datetime.utcnow(), 
        "hash": None # Start with None, implement robust hashing later if needed
    }
    
    res = db['staging_materials'].insert_one(doc)
    return str(res.inserted_id)

def check_file_hash(hash_val: str) -> bool:
    """
    Checks if a given SHA256 hash already exists in the global 'files' collection.
    """
    db = get_db_handle()
    if db is None:
        return False
    
    doc = db['files'].find_one({"hash": hash_val})
    return doc is not None

def save_file_hash(filename: str, hash_val: str):
    """
    Saves a file hash to the global 'files' collection.
    """
    db = get_db_handle()
    if db is None:
        return
        
    doc = {
        "filename": filename,
        "hash": hash_val,
        "created_at": datetime.datetime.utcnow()
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
        "created_at": datetime.datetime.utcnow()
    }
    res = db['syllabus_blueprints'].insert_one(doc)
    return str(res.inserted_id)


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
        print(f"Failed to update progress for course {course_id}: {e}")
