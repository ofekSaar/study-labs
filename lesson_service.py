from database import SessionLocal, get_db
from models import Lesson

def get_lesson(db: Session, lesson_id: int):
    return db.query(Lesson).get(lesson_id)

def create_lesson(lesson: Lesson, db: Session):
    db.add(lesson)
    db.commit()
    return lesson