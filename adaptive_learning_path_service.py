from database import SessionLocal, get_db
from models import AdaptiveLearningPath

def get_adaptive_learning_paths(db: Session):
    return db.query(AdaptiveLearningPath).all()

def create_adaptive_learning_path(adaptive_learning_path: AdaptiveLearningPath, db: Session):
    db.add(adaptive_learning_path)
    db.commit()
    return adaptive_learning_path