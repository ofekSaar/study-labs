from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from database import SessionLocal, get_db

app = FastAPI()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/adaptive-learning-paths/")
async def read_adaptive_learning_paths(db: Session = Depends(get_db)):
    return db.query(AdaptiveLearningPath).all()

@app.post("/adaptive-learning-paths/")
async def create_adaptive_learning_path(adaptive_learning_path: AdaptiveLearningPath, db: Session = Depends(get_db)):
    db.add(adaptive_learning_path)
    db.commit()
    return adaptive_learning_path