from database import SessionLocal, get_db
from models import User

def get_user(db: Session, user_id: int):
    return db.query(User).get(user_id)

def create_user(user: User, db: Session):
    db.add(user)
    db.commit()
    return user