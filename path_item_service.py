from database import SessionLocal, get_db
from models import PathItem

def get_path_item(db: Session, path_item_id: int):
    return db.query(PathItem).get(path_item_id)

def create_path_item(path_item: PathItem, db: Session):
    db.add(path_item)
    db.commit()
    return path_item